import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MovementFiscalInput, MovementFiscalRecord } from "@/lib/types";

export const movimentoFiscalKeys = {
  byMonth: (mes: string) => ["movimento-fiscal", mes] as const,
};

export function useMovimentoFiscal(mes: string) {
  return useQuery({
    queryKey: movimentoFiscalKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimento_fiscal")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return data as MovementFiscalRecord[];
    },
  });
}

/** Grava (cria ou atualiza) o registro de uma empresa no mês de referência. */
export function useSaveMovimentoFiscal(mes: string) {
  const queryClient = useQueryClient();
  const queryKey = movimentoFiscalKeys.byMonth(mes);

  return useMutation({
    mutationFn: async (record: MovementFiscalInput) => {
      const { error } = await supabase.from("movimento_fiscal").upsert(
        { ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,mes_referencia" }
      );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<MovementFiscalRecord[]>(queryKey) ?? [];
      const next = [...prev];
      const index = next.findIndex((r) => r.company_id === record.company_id);
      if (index >= 0) {
        next[index] = { ...next[index], ...record };
      } else {
        next.push({
          id: "",
          company_id: record.company_id,
          mes_referencia: mes,
          situacao: record.situacao ?? null,
          das: record.das ?? null,
          antecipacao: record.antecipacao ?? null,
          st: record.st ?? null,
          dif_aliq: record.dif_aliq ?? null,
          dif_aliq_st: record.dif_aliq_st ?? null,
          guia: record.guia ?? null,
          destda: record.destda ?? null,
          envio_sn: record.envio_sn ?? null,
          envio_icms: record.envio_icms ?? null,
          observacoes: record.observacoes ?? null,
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
