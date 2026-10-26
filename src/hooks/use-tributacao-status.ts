import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTributacoes } from "@/hooks/use-tributacoes";
import type { TributacaoStatus } from "@/lib/types";

export const tributacaoStatusKeys = {
  all: ["tributacao-status"] as const,
};

/** Opções de Status cadastradas para cada tributação. */
export function useTributacaoStatus() {
  return useQuery({
    queryKey: tributacaoStatusKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tributacao_status")
        .select("*")
        .order("ordem")
        .order("nome");
      if (error) throw error;
      return data as TributacaoStatus[];
    },
  });
}

/**
 * Opções de Status por nome de tributação (ordem de cadastro).
 * A função devolve a lista cadastrada ou, quando não há nenhuma, a lista padrão
 * da tabela do Movimento Fiscal.
 */
export function useStatusOptions() {
  const { data: tributacoes } = useTributacoes();
  const { data: statuses } = useTributacaoStatus();

  const nameById = new Map(
    (tributacoes ?? []).map((tributacao) => [tributacao.id, tributacao.nome])
  );
  const byTributacao = new Map<string, string[]>();
  for (const status of statuses ?? []) {
    const nome = nameById.get(status.tributacao_id);
    if (!nome) continue;
    const list = byTributacao.get(nome) ?? [];
    list.push(status.nome);
    byTributacao.set(nome, list);
  }

  return (
    tributacao: string | null | undefined,
    fallback: readonly string[]
  ): readonly string[] => {
    if (!tributacao) return fallback;
    const options = byTributacao.get(tributacao);
    return options && options.length > 0 ? options : fallback;
  };
}

export function useCreateTributacaoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tributacao_id,
      nome,
    }: {
      tributacao_id: string;
      nome: string;
    }) => {
      const { error } = await supabase
        .from("tributacao_status")
        .insert({ tributacao_id, nome: nome.trim() });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tributacaoStatusKeys.all }),
  });
}

export function useUpdateTributacaoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase
        .from("tributacao_status")
        .update({ nome: nome.trim() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tributacaoStatusKeys.all }),
  });
}

export function useDeleteTributacaoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tributacao_status")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tributacaoStatusKeys.all }),
  });
}
