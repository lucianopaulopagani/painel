// Diagnóstico temporário do NFS-e (protegido por token).
// Testa variações de conexão TLS com o certificado A1 e devolve o resultado de
// cada uma, sem emitir nada.
import { createClient } from "npm:@supabase/supabase-js@2";
import forge from "npm:node-forge@1.3.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "nfse-certificados";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

interface Tentativa {
  nome: string;
  ok: boolean;
  status?: number;
  erro?: string;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    const { data: valido } = await admin
      .from("nfse_diagnostico_token")
      .select("token")
      .eq("token", token)
      .maybeSingle();
    if (!valido) return json({ error: "token inválido" }, 403);

    const { data: config } = await admin
      .from("nfse_configuracoes")
      .select("company_id, certificado_path, ambiente")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!config?.certificado_path) return json({ error: "sem certificado" }, 400);

    const { data: pfx } = await admin.storage
      .from(BUCKET)
      .download(config.certificado_path);
    const { data: senhaFile } = await admin.storage
      .from(BUCKET)
      .download(`${config.company_id}/senha.txt`);
    if (!pfx || !senhaFile) return json({ error: "falha ao ler certificado" }, 500);

    const senha = await senhaFile.text();
    const bytes = new Uint8Array(await pfx.arrayBuffer());
    let binario = "";
    for (let i = 0; i < bytes.length; i += 1) binario += String.fromCharCode(bytes[i]);

    const p12 = forge.pkcs12.pkcs12FromAsn1(
      forge.asn1.fromDer(forge.util.createBuffer(binario)),
      senha
    );
    const certBags =
      p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
    const keyBags = [
      ...(p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
        forge.pki.oids.pkcs8ShroudedKeyBag
      ] ?? []),
      ...(p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] ?? []),
    ];
    if (!certBags.length || !keyBags.length) return json({ error: "pfx inválido" }, 400);

    const cadeiaPem = certBags.map((b) => forge.pki.certificateToPem(b.cert)).join("\n");
    const folhaPem = forge.pki.certificateToPem(certBags[0].cert);
    const keyPem = forge.pki.privateKeyToPem(keyBags[0].key!);

    const host =
      config.ambiente === "producao"
        ? "sefin.nfse.gov.br"
        : "sefin.producaorestrita.nfse.gov.br";
    const caminho =
      config.ambiente === "producao"
        ? "/SefinNacional/docs/index"
        : "/API/SefinNacional/docs/index";

    const executar = async (
      nome: string,
      opcoes: Deno.ConnectTlsOptions
    ): Promise<Tentativa> => {
      let conexao: Deno.TlsConn | null = null;
      try {
        conexao = await Deno.connectTls(opcoes);
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        await conexao.write(
          encoder.encode(
            `GET ${caminho} HTTP/1.1\r\nHost: ${host}\r\nUser-Agent: P4/1.0\r\nAccept: */*\r\nConnection: close\r\n\r\n`
          )
        );

        const buffer = new Uint8Array(2048);
        const lido = await Promise.race([
          conexao.read(buffer),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        if (lido === null || lido <= 0) {
          return { nome, ok: false, erro: "sem resposta" };
        }
        const texto = decoder.decode(buffer.subarray(0, lido));
        const status = Number(texto.split(" ")[1] ?? 0);
        return { nome, ok: status > 0 && status < 400, status };
      } catch (erro) {
        return {
          nome,
          ok: false,
          erro: erro instanceof Error ? erro.message : String(erro),
        };
      } finally {
        try {
          conexao?.close();
        } catch {
          /* já fechado */
        }
      }
    };

    const resultados: Tentativa[] = [];
    resultados.push(
      await executar("alpn-http1", {
        hostname: host,
        port: 443,
        cert: cadeiaPem,
        key: keyPem,
        alpnProtocols: ["http/1.1"],
      })
    );
    resultados.push(
      await executar("sem-alpn", {
        hostname: host,
        port: 443,
        cert: cadeiaPem,
        key: keyPem,
      })
    );
    resultados.push(
      await executar("folha-somente", {
        hostname: host,
        port: 443,
        cert: folhaPem,
        key: keyPem,
        alpnProtocols: ["http/1.1"],
      })
    );

    return json({
      ambiente: config.ambiente,
      certificados: certBags.length,
      titular: certBags[0].cert.subject.getField("CN")?.value ?? null,
      emissor: certBags[0].cert.issuer.getField("CN")?.value ?? null,
      emissorO: certBags[0].cert.issuer.getField("O")?.value ?? null,
      resultados,
    });
  } catch (erro) {
    return json(
      { error: erro instanceof Error ? erro.message : String(erro) },
      500
    );
  }
});
