import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { companiesKeys } from "@/hooks/use-companies";

/** Empresa do Acessórias já comparada com o cadastro local. */
export interface AcessoriasCompanyRow {
  /** Número da empresa (ID no Acessórias). */
  numero: string | null;
  documento: string;
  name: string;
  uf: string;
  inscricao_estadual: string | null;
  municipio: string | null;
  tributacao: string | null;
  ativa: boolean;
  data_inativacao: string | null;
  acessorias_id: string | null;
  /** Motivo pelo qual a empresa não pode ser importada (null = ok). */
  problema: string | null;
  /** Já existe no cadastro daqui (mesmo CNPJ/CPF). */
  existente: boolean;
}

export interface AcessoriasResult {
  ok: boolean;
  action: "preview" | "import";
  total_acessorias: number;
  /** Quantidade de empresas novas (ação de pré-visualização). */
  novos?: number;
  /** Quantidade criada (ação de importação). */
  criadas?: number;
  existentes: number;
  com_problema: number;
  empresas: AcessoriasCompanyRow[];
  erros: string[];
  error?: string;
}

interface FunctionResponse {
  ok: boolean;
  error?: string;
}

/** Extrai a mensagem devolvida pela função de backend quando a chamada falha. */
async function readFunctionError(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response }).context;
  if (!context || typeof context.json !== "function") return null;
  try {
    const payload = (await context.json()) as { error?: string };
    return payload?.error ?? null;
  } catch {
    return null;
  }
}

/** Consulta (pré-visualização) ou importa as empresas do Acessórias.
 *
 * Em "import", a lista de documentos (CNPJ/CPF) limita a importação às empresas
 * escolhidas; sem a lista, importa todas as novas.
 */
export async function invokeAcessorias(
  action: "preview" | "import",
  options?: { documentos?: string[] }
): Promise<AcessoriasResult> {
  const { data, error } = await supabase.functions.invoke<
    AcessoriasResult & FunctionResponse
  >("acessorias-sync", {
    body: { action, documentos: options?.documentos ?? [] },
  });

  if (error) {
    const message = await readFunctionError(error);
    throw new Error(
      message ?? "Falha de comunicação com a integração do Acessórias."
    );
  }
  if (!data?.ok) {
    throw new Error(data?.error ?? "A integração do Acessórias falhou.");
  }
  return data;
}

/** Importa as empresas escolhidas (ou todas as novas) e atualiza o cadastro. */
export function useAcessoriasImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentos?: string[]) =>
      invokeAcessorias("import", { documentos }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companiesKeys.all }),
  });
}
