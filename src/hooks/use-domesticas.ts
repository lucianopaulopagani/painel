import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  DomesticasRecord,
  DomesticaMovimentoInput,
  DomesticaMovimentoRecord,
} from "@/lib/types";

export const domesticasKeys = {
  all: ["domesticas"] as const,
  byMonth: (mes: string) => ["domesticas", "movimento", mes] as const,
};

export function useDomesticas() {
  return useQuery({
    queryKey: ["domesticas", "master"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domesticas")
        .select("*")
        .order("numero");
      if (error) throw error;
      return data as DomesticasRecord[];
    },
  });
}

export function useDomesticaMovimento(mes: string) {
  return useQuery({
    queryKey: domesticasKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domestica_movimento")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return data as DomesticaMovimentoRecord[];
    },
  });
}

/** Atualiza o cadastro da doméstica (nº, nome, CPF, senha). */
export function useSaveDomestica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from("domesticas")
        .update({ ...record, updated_at: new Date().toISOString() })
        .eq("id", record.id);
      if (error) throw error;
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["domesticas", "master"] }),
  });
}

export function useSaveDomesticaMovimento(mes: string) {
  const queryClient = useQueryClient();
  const queryKey = domesticasKeys.byMonth(mes);

  return useMutation({
    mutationFn: async (record: DomesticaMovimentoInput) => {
      const { error } = await supabase.from("domestica_movimento").upsert(
        { ...record, updated_at: new Date().toISOString() },
        { onConflict: "domestica_id,mes_referencia" }
      );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<DomesticaMovimentoRecord[]>(queryKey) ?? [];
      const next = [...prev];
      const index = next.findIndex(
        (r) => r.domestica_id === record.domestica_id
      );
      if (index >= 0) {
        next[index] = { ...next[index], ...record };
      } else {
        next.push({
          id: "",
          domestica_id: record.domestica_id,
          mes_referencia: mes,
          status: record.status ?? null,
          data_base: record.data_base ?? null,
          folha: record.folha ?? null,
          dae: record.dae ?? null,
          envio: record.envio ?? null,
          ponto: record.ponto ?? null,
          created_at: "",
          updated_at: "",
        });
      }
      queryClient.setQueryData(queryKey, next);
      return { prev };
    },
    onError: (_error, _record, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: domesticasKeys.all }),
  });
}
