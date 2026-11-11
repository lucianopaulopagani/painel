// =============================================================================
// Backend Function "nfse-certificado" — guarda o certificado A1 da empresa
// emissora de NFS-e em um bucket privado e grava a configuração fiscal.
//
// O arquivo .pfx e a senha nunca passam pelo navegador depois do envio: ficam
// no bucket privado "nfse-certificados", acessível apenas pelo backend.
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import forge from "npm:node-forge@1.3.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "nfse-certificados";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Somente administradores configuram certificado. */
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

function base64ToBytes(base64: string): Uint8Array {
  const limpo = base64.includes(",") ? base64.split(",")[1] : base64;
  const bin = atob(limpo.replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!(await isAdmin(req.headers.get("Authorization")))) {
      return json(
        { error: "Somente administradores podem configurar o certificado." },
        401
      );
    }

    const body = await req.json().catch(() => null);
    const companyId = body?.company_id as string | undefined;
    const pfxBase64 = body?.pfx_base64 as string | undefined;
    const senha = body?.senha as string | undefined;

    if (!companyId || !pfxBase64 || !senha) {
      return json(
        { error: "Informe a empresa, o arquivo .pfx e a senha do certificado." },
        400
      );
    }

    const bytes = base64ToBytes(pfxBase64);
    if (bytes.length < 100) {
      return json({ error: "Arquivo de certificado inválido." }, 400);
    }

    // Valida a senha e lê o titular/validade do A1.
    let titular = "";
    let validade = "";
    try {
      let binario = "";
      for (let i = 0; i < bytes.length; i += 1) {
        binario += String.fromCharCode(bytes[i]);
      }
      const der = forge.util.createBuffer(binario);
      const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(der), senha);
      const certBags = p12.getBags({
        bagType: forge.pki.oids.certBag,
      })[forge.pki.oids.certBag];
      const certificado = certBags?.[0]?.cert;
      if (!certificado) throw new Error("certificado ausente");
      titular =
        certificado.subject.getField("CN")?.value ??
        certificado.subject.getField("O")?.value ??
        "";
      validade = certificado.validity.notAfter.toISOString().slice(0, 10);
    } catch {
      return json(
        { error: "Não foi possível ler o certificado. Confira a senha e o arquivo .pfx." },
        400
      );
    }

    const caminho = `${companyId}/certificado.pfx`;
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(caminho, bytes, {
        upsert: true,
        contentType: "application/x-pkcs12",
      });
    if (uploadError) {
      return json({ error: uploadError.message }, 500);
    }

    // A senha fica no mesmo bucket privado, em arquivo separado.
    const { error: senhaError } = await admin.storage
      .from(BUCKET)
      .upload(`${companyId}/senha.txt`, new Blob([senha], { type: "text/plain" }), {
        upsert: true,
        contentType: "text/plain",
      });
    if (senhaError) {
      return json({ error: senhaError.message }, 500);
    }

    const { error: saveError } = await admin.from("nfse_configuracoes").upsert(
      {
        company_id: companyId,
        ambiente: body?.ambiente === "producao" ? "producao" : "restrita",
        certificado_path: caminho,
        certificado_nome: body?.certificado_nome ?? "certificado.pfx",
        certificado_validade: validade || null,
        certificado_titular: titular || null,
        inscricao_municipal: body?.inscricao_municipal ?? null,
        codigo_municipio: body?.codigo_municipio ?? null,
        codigo_servico: body?.codigo_servico ?? null,
        nbs: body?.nbs ?? null,
        aliquota_iss: Number(body?.aliquota_iss ?? 0) || 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" }
    );

    if (saveError) {
      return json({ error: saveError.message }, 500);
    }

    return json({ ok: true, titular, validade });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao salvar o certificado.",
      },
      500
    );
  }
});
