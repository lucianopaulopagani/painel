import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  AlvaraBombeirosInput,
  AlvaraBombeirosRecord,
} from "@/lib/types";

export const alvaraBombeirosKeys = {
  all: ["alvara-bombeiros"] as const,
  byAno: (ano: string) => ["alvara-bombeiros", ano] as const,
};

export function useAlvaraBombeiros(ano: string) {
  return useQuery({
    queryKey: alvaraBombeirosKeys.byAno(ano),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alvara_bombeiros")
        .select("*")
        .eq("ano", ano);
      if (error) throw error;
      return data as AlvaraBombeirosRecord[];
    },
  });
}

export function useAlvaraBombeirosAll() {
  return useQuery({
    queryKey: ["alvara-bombeiros", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase.from("alvara_bombeiros").select("*");
      if (error) throw error;
      return data as AlvaraBombeirosRecord[];
    },
  });
}

export function useSaveAlvaraBombeiros(ano: string) {
  const queryClient = useQueryClient();
  const queryKey = alvaraBombeirosKeys.byAno(ano);

  return useMutation({
    mutationFn: async (record: AlvaraBombeirosInput) => {
      const { error } = await supabase.from("alvara_bombeiros").upsert(
        { ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,ano" }
      );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<AlvaraBombeirosRecord[]>(queryKey) ?? [];
      const next = [...prev];
      const index = next.findIndex((r) => r.company_id === record.company_id);
      if (index >= 0) {
        next[index] = { ...next[index], ...record };
      } else {
        next.push({
          id: "",
          company_id: record.company_id,
          ano,
          vencimento: record.vencimento ?? null,
          gerado: record.gerado ?? null,
          enviado: record.enviado ?? null,
          observacao: record.observacao ?? null,
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
      queryClient.invalidateQueries({ queryKey: alvaraBombeirosKeys.all }),
  });
}
