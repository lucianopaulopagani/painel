import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ParcelamentoInput, ParcelamentoRecord } from "@/lib/types";

export const parcelamentosKeys = {
  all: ["parcelamentos"] as const,
  byMonth: (mes: string) => ["parcelamentos", mes] as const,
};

/** Registros do Controle de Parcelamentos do mês de referência. */
export function useParcelamentos(mes: string) {
  return useQuery({
    queryKey: parcelamentosKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelamentos")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return (data ?? []) as ParcelamentoRecord[];
    },
  });
}

/** Todos os registros (usado na herança do "Desabilitado" entre meses). */
export function useAllParcelamentos() {
  return useQuery({
    queryKey: ["parcelamentos", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase.from("parcelamentos").select("*");
      if (error) throw error;
      return (data ?? []) as ParcelamentoRecord[];
    },
  });
}

/** Grava (cria ou atualiza) o registro de uma empresa no mês de referência. */
export function useSaveParcelamento(mes: string) {
  const queryClient = useQueryClient();
  const queryKey = parcelamentosKeys.byMonth(mes);

  return useMutation({
    mutationFn: async (record: Partial<ParcelamentoInput>) => {
      const { error } = await supabase.from("parcelamentos").upsert(
        { mes_referencia: mes, ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,mes_referencia" }
      );
      if (error) throw error;
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: parcelamentosKeys.all }),
  });
}
