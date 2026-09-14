import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PontoInput, PontoRecord } from "@/lib/types";

export const pontoKeys = {
  all: ["ponto"] as const,
  byMonth: (mes: string) => ["ponto", mes] as const,
};

export function usePonto(mes: string) {
  return useQuery({
    queryKey: pontoKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ponto")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return data as PontoRecord[];
    },
  });
}

/** Grava (cria ou atualiza) o envio de Ponto de uma empresa no mês. */
export function useSavePonto(mes: string) {
  const queryClient = useQueryClient();
  const queryKey = pontoKeys.byMonth(mes);

  return useMutation({
    mutationFn: async (record: PontoInput) => {
      const { error } = await supabase.from("ponto").upsert(
        { ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,mes_referencia" }
      );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<PontoRecord[]>(queryKey) ?? [];
      const next = [...prev];
      const index = next.findIndex((r) => r.company_id === record.company_id);
      if (index >= 0) {
        next[index] = { ...next[index], ...record };
      } else {
        next.push({
          id: "",
          company_id: record.company_id,
          mes_referencia: mes,
          envio: record.envio ?? null,
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
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
