import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  MovimentoCarneLeaoInput,
  MovimentoCarneLeaoRecord,
} from "@/lib/types";

export const carneLeaoKeys = {
  all: ["carne-leao"] as const,
  byMonth: (mes: string) => ["carne-leao", mes] as const,
};

export function useCarneLeao(mes: string) {
  return useQuery({
    queryKey: carneLeaoKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimento_fiscal_carne_leao")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return data as MovimentoCarneLeaoRecord[];
    },
  });
}

export function useCarneLeaoAll() {
  return useQuery({
    queryKey: ["carne-leao", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimento_fiscal_carne_leao")
        .select("*");
      if (error) throw error;
      return data as MovimentoCarneLeaoRecord[];
    },
  });
}

export function useSaveCarneLeao(mes: string) {  const queryClient = useQueryClient();
  const queryKey = carneLeaoKeys.byMonth(mes);

  return useMutation({
    mutationFn: async (record: MovimentoCarneLeaoInput) => {
      const { error } = await supabase
        .from("movimento_fiscal_carne_leao")
        .upsert(
          { ...record, updated_at: new Date().toISOString() },
          { onConflict: "company_id,mes_referencia" }
        );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<MovimentoCarneLeaoRecord[]>(queryKey) ?? [];
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
          prestados: record.prestados ?? null,
          tomados: record.tomados ?? null,
          iss_fixo: record.iss_fixo ?? null,
          carne_leao: record.carne_leao ?? null,
          envio_guia: record.envio_guia ?? null,
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
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: carneLeaoKeys.all }),
  });
}
