// =============================================================================
// Backend Function "analise-simulador" — leitura da simulação da Reforma
// Tributária (Simples Nacional 2027) gerada por IA.
//
// Por que existe: a chave da IA nunca pode ficar no frontend. Esta função roda
// no backend do Enter Cloud, autentica o usuário pelo token enviado no header
// Authorization e devolve uma análise em texto na voz da P4 Contabilidade.
//
// Entrada:  { perfil: "servicos" | "comercio", dados: { ...rótulos já formatados } }
// Saída:    { analise: string }
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_d3a8c731c16c");
const AI_MODEL = "openai/gpt-6-luna";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-id",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = [
  "Você é o analista tributário da P4 Contabilidade.",
  "Recebe os números de uma simulação do Simples Nacional para 2027 comparando",
  "o DAS integral com o Simples híbrido de IBS e CBS, e devolve uma leitura",
  "objetiva em português do Brasil, na voz da P4: direta, técnica, sem jargão",
  "desnecessário, sem promessas e sem emojis.",
  "",
  "Regras obrigatórias:",
  "- Use somente os dados fornecidos. Nunca invente alíquotas, prazos ou artigos.",
  "- Se precisar de base legal, cite apenas LC 214/2025, Res. CGSN 140/2026 e",
  "  Res. CGSN 190/2026, e apenas quando os dados indicarem o dispositivo.",
  "- Não recalcule nem arredonde números que já vieram calculados.",
  "- Trate os valores como premissas da simulação, não como fato consumado.",
  "- No máximo 300 palavras, sem tabelas e sem listas longas.",
  "",
  "Formato da resposta (quatro blocos, títulos em negrito, texto corrido):",
  "**Leitura rápida** — o que o resultado mostra em duas ou três frases.",
  "**O que puxa o resultado** — os dois ou três números que decidem a conta.",
  "**Recomendação** — qual regime a simulação favorece e em que condição.",
  "**Próximos passos** — o que a P4 precisa conferir com o cliente antes de decidir.",
].join("\n");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!AI_API_TOKEN) {
      return json(
        { error: { message: "A análise por IA não está configurada." } },
        500
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json(
        { error: { message: "Faça login para usar a análise por IA." } },
        401
      );
    }

    // A sessão é verificada no backend, nunca no navegador.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return json(
        { error: { message: "Sessão expirada. Entre novamente no sistema." } },
        401
      );
    }

    const body = await req.json().catch(() => null);
    const perfil = body?.perfil === "comercio" ? "comercio" : "servicos";
    const dados = body?.dados;
    if (
      !dados ||
      typeof dados !== "object" ||
      Array.isArray(dados) ||
      Object.keys(dados as Record<string, unknown>).length === 0
    ) {
      return json(
        { error: { message: "Envie o caso do simulador para a análise." } },
        400
      );
    }

    const linhas = Object.entries(dados as Record<string, unknown>)
      .filter(([, valor]) => valor !== null && valor !== undefined && valor !== "")
      .map(([chave, valor]) => `${chave}: ${String(valor)}`)
      .join("\n");

    const perfilTxt =
      perfil === "comercio" ? "Comércio e indústria" : "Prestação de serviços";

    const prompt = [
      `Perfil simulado: ${perfilTxt}.`,
      "",
      "Dados da simulação (rótulos e valores já calculados pela ferramenta):",
      linhas,
      "",
      "Escreva a análise para o sócio da empresa simulado, tratando o cliente",
      "que consulta a P4. Não repita a lista de dados; interprete.",
    ].join("\n");

    const response = await fetch(
      "https://api.enter.pro/code/api/v1/ai/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AI_API_TOKEN}`,
          "Content-Type": "application/json",
          "X-Session-ID": req.headers.get("X-Session-ID")?.trim() || crypto.randomUUID(),
          "X-Enter-Project-ID": "d3a8c731c16c40afb612732f74c10df3",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          input: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          stream: false,
          max_output_tokens: 900,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      let message = "Não foi possível gerar a análise agora.";
      try {
        const parsed = JSON.parse(text);
        message = parsed?.error?.message || message;
      } catch {
        /* mantém a mensagem padrão */
      }
      console.error("analise-simulador: IA respondeu", response.status, message);
      return json({ error: { message } }, response.status);
    }

    const data = await response.json();
    const texto =
      typeof data?.output_text === "string" && data.output_text.trim()
        ? data.output_text
        : (data?.output ?? [])
            .flatMap((item: { content?: { text?: string }[] }) => item.content ?? [])
            .map((part: { text?: string }) => part.text ?? "")
            .join("")
            .trim();

    if (!texto) {
      console.error("analise-simulador: resposta sem texto", JSON.stringify(data).slice(0, 400));
      return json(
        { error: { message: "A IA não devolveu texto. Tente novamente." } },
        502
      );
    }

    return json({ analise: texto });
  } catch (error) {
    console.error("analise-simulador:", error);
    return json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Erro inesperado ao gerar a análise.",
        },
      },
      500
    );
  }
});
