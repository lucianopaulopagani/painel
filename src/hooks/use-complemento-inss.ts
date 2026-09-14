import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  ComplementoInssInput,
  ComplementoInssRecord,
} from "@/lib/types";

export const complementoInssKeys = {
  all: ["complemento-inss"] as const,
  byMonth: (mes: string) => ["complemento-inss", mes] as const,
};

export function useComplementoInss(mes: string) {
  return useQuery({
    queryKey: complementoInssKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complemento_inss")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return data as ComplementoInssRecord[];
    },
  });
}

export function useComplementoInssAll() {
  return useQuery({
    queryKey: ["complemento-inss", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complemento_inss")
        .select("*");
      if (error) throw error;
      return data as ComplementoInssRecord[];
    },
  });
}

export function useSaveComplementoInss(mes: string) {
  const queryClient = useQueryClient();
  const queryKey = complementoInssKeys.byMonth(mes);

  return useMutation({
    mutationFn: async (record: ComplementoInssInput) => {
      const { error } = await supabase.from("complemento_inss").upsert(
        { ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,mes_referencia" }
      );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<ComplementoInssRecord[]>(queryKey) ?? [];
      const next = [...prev];
      const index = next.findIndex((r) => r.company_id === record.company_id);
      if (index >= 0) {
        next[index] = { ...next[index], ...record };
      } else {
        next.push({
          id: "",
          company_id: record.company_id,
          mes_referencia: mes,
          darf: record.darf ?? null,
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
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: complementoInssKeys.all }),
  });
}
