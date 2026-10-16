import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  DomesticasMovimentoInput,
  DomesticasMovimentoRecord,
} from "@/lib/types";

export const domesticasMovimentoKeys = {
  all: ["domesticas-movimento"] as const,
  byMonth: (mes: string) => ["domesticas-movimento", mes] as const,
};

/** Movimento de Domésticas (por empresa) no mês de referência. */
export function useDomesticasMovimento(mes: string) {
  return useQuery({
    queryKey: domesticasMovimentoKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domesticas_movimento")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return (data ?? []) as DomesticasMovimentoRecord[];
    },
  });
}

/** Todo o histórico (usado na herança de Data Base, Senha e Sem Movimento). */
export function useAllDomesticasMovimento() {
  return useQuery({
    queryKey: ["domesticas-movimento", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domesticas_movimento")
        .select("*");
      if (error) throw error;
      return (data ?? []) as DomesticasMovimentoRecord[];
    },
  });
}

/** Grava (cria ou atualiza) o movimento de uma empresa no mês de referência. */
export function useSaveDomesticasMovimento(mes: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Partial<DomesticasMovimentoInput>) => {
      const { error } = await supabase.from("domesticas_movimento").upsert(
        { mes_referencia: mes, ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,mes_referencia" }
      );
      if (error) throw error;
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: domesticasMovimentoKeys.all }),
  });
}
