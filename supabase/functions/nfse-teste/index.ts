// =============================================================================
// Backend Function "nfse-teste" — valida o certificado A1 abrindo uma conexão
// mTLS com o NFS-e Nacional. Não emite nada: apenas confirma que o certificado
// é aceito pelo ambiente configurado.
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

  try {
    if (!(await isAdmin(req.headers.get("Authorization")))) {
      return json({ error: "Somente administradores podem testar a conexão." }, 401);
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
      return json({ error: "Certificado não configurado para esta empresa." }, 400);
    }

    const { data: pfx, error: pfxError } = await admin.storage
      .from(BUCKET)
      .download(config.certificado_path);
    const { data: senhaFile, error: senhaError } = await admin.storage
      .from(BUCKET)
      .download(`${companyId}/senha.txt`);

    if (pfxError || !pfx || senhaError || !senhaFile) {
      return json({ error: "Não foi possível ler o certificado guardado." }, 500);
    }

    const senha = await senhaFile.text();
    const bytes = new Uint8Array(await pfx.arrayBuffer());
    let binario = "";
    for (let i = 0; i < bytes.length; i += 1) binario += String.fromCharCode(bytes[i]);

    const p12 = forge.pkcs12.pkcs12FromAsn1(
      forge.asn1.fromDer(forge.util.createBuffer(binario)),
      senha
    );

    const certBags =
      p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ??
      [];
    const keyBags = [
      ...(p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
        forge.pki.oids.pkcs8ShroudedKeyBag
      ] ?? []),
      ...(p12.getBags({ bagType: forge.pki.oids.keyBag })[
        forge.pki.oids.keyBag
      ] ?? []),
    ];

    if (certBags.length === 0 || keyBags.length === 0) {
      return json({ error: "Certificado sem chave privada utilizável." }, 400);
    }

    const certPem = certBags
      .map((bag) => forge.pki.certificateToPem(bag.cert))
      .join("\n");
    const keyPem = forge.pki.privateKeyToPem(keyBags[0].key!);

    const base =
      config.ambiente === "producao"
        ? "https://sefin.nfse.gov.br/SefinNacional"
        : "https://sefin.producaorestrita.nfse.gov.br/API/SefinNacional";

    const criarCliente = (
      Deno as unknown as {
        createHttpClient: (options: { cert: string; key: string }) => unknown;
      }
    ).createHttpClient;

    const client = criarCliente({ cert: certPem, key: keyPem });

    const resposta = await fetch(`${base}/docs/index`, {
      // @ts-expect-error opção específica do Deno para TLS com certificado
      client,
    });

    return json({
      ok: resposta.ok,
      status: resposta.status,
      ambiente: config.ambiente,
      titular: certBags[0].cert.subject.getField("CN")?.value ?? null,
      validade: certBags[0].cert.validity.notAfter.toISOString().slice(0, 10),
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? `Falha na conexão: ${error.message}`
            : "Falha na conexão com o NFS-e Nacional.",
      },
      500
    );
  }
});
