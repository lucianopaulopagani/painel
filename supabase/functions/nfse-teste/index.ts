// =============================================================================
// Backend Function "nfse-teste" — valida o certificado A1 abrindo uma conexão
// mTLS com o NFS-e Nacional. Não emite nada: confirma se o certificado é aceito
// pelo ambiente configurado e registra cada etapa em nfse_logs.
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import forge from "npm:node-forge@1.3.1";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "nfse-certificados";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function isAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return false;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  return profile?.role === "admin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const registrar = async (
    companyId: string | null,
    etapa: string,
    sucesso: boolean,
    mensagem: string,
    detalhe?: string
  ) => {
    try {
      await admin.from("nfse_logs").insert({
        company_id: companyId,
        etapa,
        sucesso,
        mensagem,
        detalhe: detalhe ?? null,
      });
    } catch {
      /* log é auxiliar: não interrompe o teste */
    }
  };

  try {
    if (!(await isAdmin(req.headers.get("Authorization")))) {
      return json(
        { error: "Somente administradores podem testar a conexão." },
        401
      );
    }

    const body = await req.json().catch(() => null);
    const companyId = body?.company_id as string | undefined;
    if (!companyId) {
      return json({ error: "Informe a empresa." }, 400);
    }

    const { data: config } = await admin
      .from("nfse_configuracoes")
      .select("certificado_path, ambiente")
      .eq("company_id", companyId)
      .maybeSingle();

    if (!config?.certificado_path) {
      await registrar(companyId, "configuracao", false, "Certificado não configurado");
      return json({ error: "Certificado não configurado para esta empresa." }, 400);
    }

    const { data: pfx, error: pfxError } = await admin.storage
      .from(BUCKET)
      .download(config.certificado_path);
    const { data: senhaFile, error: senhaError } = await admin.storage
      .from(BUCKET)
      .download(`${companyId}/senha.txt`);

    if (pfxError || !pfx || senhaError || !senhaFile) {
      await registrar(
        companyId,
        "download",
        false,
        "Falha ao ler o certificado do armazenamento",
        `${pfxError?.message ?? ""} ${senhaError?.message ?? ""}`.trim()
      );
      return json({ error: "Não foi possível ler o certificado guardado." }, 500);
    }

    const senha = await senhaFile.text();
    const bytes = new Uint8Array(await pfx.arrayBuffer());
    let binario = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binario += String.fromCharCode(bytes[i]);
    }

    let certPem = "";
    let keyPem = "";
    let titular = "";
    try {
      const p12 = forge.pkcs12.pkcs12FromAsn1(
        forge.asn1.fromDer(forge.util.createBuffer(binario)),
        senha
      );
      const certBags =
        p12.getBags({ bagType: forge.pki.oids.certBag })[
          forge.pki.oids.certBag
        ] ?? [];
      const keyBags = [
        ...(p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
          forge.pki.oids.pkcs8ShroudedKeyBag
        ] ?? []),
        ...(p12.getBags({ bagType: forge.pki.oids.keyBag })[
          forge.pki.oids.keyBag
        ] ?? []),
      ];
      if (certBags.length === 0 || keyBags.length === 0) {
        throw new Error("certificado sem chave privada");
      }
      certPem = certBags.map((bag) => forge.pki.certificateToPem(bag.cert)).join("\n");
      keyPem = forge.pki.privateKeyToPem(keyBags[0].key!);
      titular = certBags[0].cert.subject.getField("CN")?.value ?? "";
      await registrar(companyId, "certificado", true, "Certificado aberto", titular);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      await registrar(companyId, "certificado", false, "Falha ao abrir o .pfx", mensagem);
      return json({ error: `Falha ao abrir o certificado: ${mensagem}` }, 400);
    }

    const base =
      config.ambiente === "producao"
        ? "https://sefin.nfse.gov.br/SefinNacional"
        : "https://sefin.producaorestrita.nfse.gov.br/API/SefinNacional";

    // O Sefin exige HTTP/1.1 e o certificado no handshake TLS. Abrimos o socket
    // TLS com ALPN fixo em http/1.1 e escrevemos a requisição manualmente.
    const chamarSefin = async (url: string): Promise<number> => {
      const alvo = new URL(url);
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const conexao = await Deno.connectTls({
        hostname: alvo.hostname,
        port: 443,
        cert: certPem,
        key: keyPem,
        alpnProtocols: ["http/1.1"],
      });

      try {
        const caminho = `${alvo.pathname}${alvo.search}`;
        const requisicao =
          `GET ${caminho} HTTP/1.1\r\n` +
          `Host: ${alvo.hostname}\r\n` +
          `User-Agent: P4-NFSe/1.0\r\n` +
          `Accept: */*\r\n` +
          `Connection: close\r\n\r\n`;

        await conexao.write(encoder.encode(requisicao));

        let texto = "";
        const buffer = new Uint8Array(4096);
        const limite = Date.now() + 20000;

        while (Date.now() < limite) {
          const lido = await Promise.race([
            conexao.read(buffer),
            new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), 5000)
            ),
          ]);
          if (lido === null || lido <= 0) break;
          texto += decoder.decode(buffer.subarray(0, lido));
        }

        const primeiraLinha = texto.split("\r\n")[0] ?? "";
        const partes = primeiraLinha.split(" ");
        const status = Number(partes[1] ?? 0);
        return Number.isFinite(status) ? status : 0;
      } finally {
        try {
          conexao.close();
        } catch {
          /* já fechado */
        }
      }
    };

    try {
      const status = await chamarSefin(`${base}/docs/index`);

      await registrar(
        companyId,
        "http",
        status > 0 && status < 400,
        `Sefin respondeu HTTP ${status}`,
        config.ambiente
      );

      return json({
        ok: status > 0 && status < 400,
        status,
        ambiente: config.ambiente,
        titular,
      });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      await registrar(companyId, "http", false, "Falha na requisição ao Sefin", mensagem);
      return json({ error: `Falha na conexão: ${mensagem}` }, 500);
    }
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : String(error);
    await registrar(null, "geral", false, "Erro inesperado", mensagem);
    return json({ error: `Erro inesperado: ${mensagem}` }, 500);
  }
});
