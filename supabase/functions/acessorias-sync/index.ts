/**
 * Integração com o sistema Acessórias (api.acessorias.com).
 *
 * Consulta as empresas cadastradas no Acessórias e cria aqui as que ainda não
 * existem (o CNPJ/CPF é a chave de comparação). Nenhuma empresa existente é
 * alterada, e os departamentos/responsáveis não são importados.
 *
 * O token da API fica no segredo ACESSORIAS_TOKEN (nunca no frontend).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ACESSORIAS_BASE_URL = "https://api.acessorias.com";
/** O Acessórias devolve 20 empresas por página. */
const PAGE_SIZE = 20;
const MAX_PAGES = 300;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface AcessoriasCompany {
  ID?: string | number;
  Identificador?: string;
  Razao?: string;
  Fantasia?: string;
  Status?: string;
  UF?: string;
  Regime?: string;
  ClienteAte?: string;
  InscricoesEstaduais?: { IE?: string; UF?: string }[];
  [key: string]: unknown;
}

interface CompanyToImport {
  /** Número da empresa (ID no Acessórias). */
  numero: string | null;
  documento: string;
  name: string;
  /** Nome fantasia (ajuda na busca). */
  fantasia: string | null;
  uf: string;
  inscricao_estadual: string | null;
  municipio: string | null;
  tributacao: string | null;
  ativa: boolean;
  data_inativacao: string | null;
  /** ID da empresa no Acessórias (apenas informativo). */
  acessorias_id: string | null;
  /** Motivo pelo qual a empresa não pode ser importada. */
  problema: string | null;
  /** Já existe no cadastro daqui (comparação pelo CNPJ/CPF). */
  existente: boolean;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const onlyDigits = (value: unknown): string => String(value ?? "").replace(/\D/g, "");

const normalize = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

/** Data do Acessórias (YYYY-MM-DD) → data válida ou null (0000-00-00 = vazio). */
function toIsoDate(value: unknown): string | null {
  const text = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!match) return null;
  const [, year, month, day] = match;
  if (year === "0000" || month === "00" || day === "00") return null;
  return `${year}-${month}-${day}`;
}

/** Empresa ativa? O Acessórias devolve "Ativa"/"Inativa" (ou S/N). */
function isAtiva(company: AcessoriasCompany): boolean {
  const status = normalize(company.Status);
  if (!status) return true;
  if (status === "s" || status.startsWith("ativ")) return true;
  if (status === "n" || status.startsWith("inativ")) return false;
  return true;
}

/** Inscrição estadual da empresa (prefere a da UF cadastrada). */
function stateRegistration(
  company: AcessoriasCompany,
  uf: string
): string | null {
  const list = Array.isArray(company.InscricoesEstaduais)
    ? company.InscricoesEstaduais
    : [];
  const entries = list
    .map((item) => ({
      ie: String(item?.IE ?? "").trim(),
      uf: String(item?.UF ?? "").trim().toUpperCase(),
    }))
    .filter((item) => item.ie);
  if (entries.length === 0) return null;
  return (entries.find((item) => item.uf === uf) ?? entries[0]).ie;
}

/**
 * Regime do Acessórias → tributação cadastrada aqui.
 *
 * Ex.: "Simples nacional com inscrição estadual" → "Simples Nacional";
 * "Domésticas/Caseiro - e-Social" → "Empregada Doméstica".
 */
function mapTributacao(
  regime: unknown,
  registered: string[]
): string | null {
  const text = normalize(regime);
  if (!text) return null;

  const exact = registered.find((option) => normalize(option) === text);
  if (exact) return exact;

  // Casa pelo nome cadastrado contido no texto do regime (o mais específico
  // primeiro), cobrindo "Simples nacional ...", "Lucro presumido ..." etc.
  const contained = registered
    .filter((option) => normalize(option) && text.includes(normalize(option)))
    .sort((a, b) => b.length - a.length);
  if (contained.length > 0) return contained[0];

  const aliases: { match: string; target: string }[] = [
    { match: "domesticas", target: "Empregada Doméstica" },
    { match: "caseiro", target: "Empregada Doméstica" },
    { match: "pessoa fisica", target: "Pessoa Física" },
    { match: "mei", target: "MEI" },
  ];
  for (const alias of aliases) {
    if (!text.includes(alias.match)) continue;
    const target = registered.find(
      (option) => normalize(option) === normalize(alias.target)
    );
    if (target) return target;
  }
  return null;
}

/** Cidade/município (o Acessórias nem sempre devolve; lê as variações). */
function municipioOf(company: AcessoriasCompany): string | null {
  const candidate =
    company.Cidade ?? company.Municipio ?? company.EndCidade ?? null;
  const text = String(candidate ?? "").trim();
  if (text) return text;
  // Algumas respostas trazem "Cidade - UF" no endereço.
  const endereco = String(company.Endereco ?? "").trim();
  if (!endereco) return null;
  return null;
}

/** Busca todas as páginas de empresas do Acessórias. */
async function fetchAcessoriasCompanies(token: string): Promise<{
  companies: AcessoriasCompany[];
  errors: string[];
}> {
  const companies: AcessoriasCompany[] = [];
  const errors: string[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url =
      `${ACESSORIAS_BASE_URL}/companies/ListAll` +
      `?stateRegistrations&registrationData&Pagina=${page}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      errors.push(
        `Falha de comunicação na página ${page}: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`
      );
      break;
    }

    if (response.status === 401 || response.status === 403) {
      errors.push(
        "Token recusado pelo Acessórias (HTTP " +
          response.status +
          "). Gere um novo token em Configurações → API Token."
      );
      break;
    }
    if (!response.ok) {
      errors.push(`Página ${page}: HTTP ${response.status}.`);
      break;
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      errors.push(`Página ${page}: resposta inválida do Acessórias.`);
      break;
    }

    if (payload && !Array.isArray(payload) && typeof payload === "object") {
      const message = (payload as { Erro?: string }).Erro;
      errors.push(message ? String(message) : "O Acessórias retornou um erro.");
      break;
    }
    if (!Array.isArray(payload) || payload.length === 0) break;

    companies.push(...(payload as AcessoriasCompany[]));
    if (payload.length < PAGE_SIZE) break;
  }

  return { companies, errors };
}

/** Monta a lista comparando com o cadastro atual (nada é gravado). */
async function buildImportList(): Promise<{
  items: CompanyToImport[];
  errors: string[];
  totalAcessorias: number;
}> {
  const token = Deno.env.get("ACESSORIAS_TOKEN") ?? "";
  if (!token) {
    return {
      items: [],
      errors: [
        "Token do Acessórias não configurado. Gere o token em Configurações → API Token e cadastre-o aqui.",
      ],
      totalAcessorias: 0,
    };
  }

  const [{ data: companiesRows }, { data: tributacoesRows }, acessorias] =
    await Promise.all([
      admin.from("companies").select("documento, numero, tipo"),
      admin.from("tributacoes").select("nome").order("ordem").order("nome"),
      fetchAcessoriasCompanies(token),
    ]);

  const existing = new Set(
    (companiesRows ?? []).map((row) => onlyDigits(row.documento))
  );
  // O número é único entre matrizes — evita conflito na importação.
  const usedNumbers = new Set(
    (companiesRows ?? [])
      .filter((row) => row.tipo !== "filial")
      .map((row) => String(row.numero ?? "").trim())
      .filter(Boolean)
  );
  const registered = (tributacoesRows ?? [])
    .map((row) => String(row.nome ?? "").trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const items: CompanyToImport[] = [];

  for (const company of acessorias.companies) {
    const documento = onlyDigits(company.Identificador);
    const numero = String(company.ID ?? "").trim() || null;
    const name = String(company.Razao ?? company.Fantasia ?? "").trim();
    const uf = String(company.UF ?? "").trim().toUpperCase().slice(0, 2);
    const ativa = isAtiva(company);

    let problema: string | null = null;
    if (documento.length !== 11 && documento.length !== 14) {
      problema = "CNPJ/CPF inválido ou ausente";
    } else if (!name) {
      problema = "Razão social ausente";
    } else if (uf.length !== 2) {
      problema = "UF ausente";
    } else if (seen.has(documento)) {
      problema = "CNPJ/CPF repetido no Acessórias";
    } else if (numero && usedNumbers.has(numero)) {
      problema = `Número ${numero} já cadastrado em outra empresa (matriz)`;
    }

    if (documento) seen.add(documento);
    if (numero) usedNumbers.add(numero);

    items.push({
      numero,
      documento,
      name,
      fantasia: String(company.Fantasia ?? "").trim() || null,
      uf,
      inscricao_estadual: stateRegistration(company, uf),
      municipio: municipioOf(company),
      tributacao: mapTributacao(company.Regime, registered),
      ativa,
      data_inativacao: ativa ? null : toIsoDate(company.ClienteAte),
      acessorias_id: company.ID ? String(company.ID) : null,
      problema,
      existente: documento ? existing.has(documento) : false,
    });
  }

  return {
    items,
    errors: acessorias.errors,
    totalAcessorias: acessorias.companies.length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "Método não permitido." }, 405);
  }

  // Somente administradores.
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ ok: false, error: "Sessão inválida." }, 401);
  }
  const { data: userData, error: userError } = await admin.auth.getUser(
    authorization.replace("Bearer ", "")
  );
  if (userError || !userData?.user) {
    return json({ ok: false, error: "Sessão inválida." }, 401);
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return json(
      { ok: false, error: "Somente administradores podem usar esta integração." },
      401
    );
  }

  let payload: { action?: string; documentos?: unknown } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const action = payload.action ?? "preview";
  // Documentos (CNPJ/CPF) escolhidos para importar; vazio = todas as novas.
  const documentos = Array.isArray(payload.documentos)
    ? (payload.documentos as unknown[])
        .map((item) => onlyDigits(item))
        .filter((item) => item.length === 11 || item.length === 14)
    : [];

  if (action !== "preview" && action !== "import") {
    return json({ ok: false, error: "Ação inválida." }, 400);
  }

  try {
    const list = await buildImportList();
    const novos = list.items.filter(
      (item) => !item.existente && !item.problema
    );
    const existentes = list.items.filter((item) => item.existente).length;
    const comProblema = list.items.filter((item) => item.problema).length;

    if (action === "preview") {
      return json({
        ok: true,
        action,
        total_acessorias: list.totalAcessorias,
        novos: novos.length,
        existentes,
        com_problema: comProblema,
        empresas: list.items,
        erros: list.errors,
      });
    }

    // Importação: cria apenas as novas (nenhuma empresa existente é alterada).
    // Com uma lista de documentos, importa somente as empresas escolhidas.
    const escolhidas =
      documentos.length > 0
        ? novos.filter((item) => documentos.includes(item.documento))
        : novos;

    const toInsert = escolhidas.map((item) => ({
      numero: item.numero,
      tipo: "matriz",
      name: item.name,
      documento: item.documento,
      inscricao_estadual: item.inscricao_estadual,
      uf: item.uf,
      municipio: item.municipio,
      tributacao: item.tributacao,
      ativa: item.ativa,
      motivo_inativacao: null,
      data_inativacao: item.data_inativacao,
    }));

    let criadas = 0;
    const insertErrors: string[] = [];
    for (let index = 0; index < toInsert.length; index += 100) {
      const chunk = toInsert.slice(index, index + 100);
      const { data, error } = await admin
        .from("companies")
        .insert(chunk)
        .select("id");
      if (!error) {
        criadas += data?.length ?? 0;
        continue;
      }
      // Um registro problemático não pode derrubar o lote: grava um a um.
      insertErrors.push(error.message);
      for (const row of chunk) {
        const single = await admin
          .from("companies")
          .insert(row)
          .select("id")
          .maybeSingle();
        if (single.error) {
          insertErrors.push(`${row.name}: ${single.error.message}`);
        } else {
          criadas += 1;
        }
      }
    }

    return json({
      ok: true,
      action,
      total_acessorias: list.totalAcessorias,
      selecionadas: escolhidas.length,
      criadas,
      existentes,
      com_problema: comProblema,
      erros: [...list.errors, ...insertErrors],
      empresas: list.items,
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao consultar o Acessórias.",
      },
      500
    );
  }
});
