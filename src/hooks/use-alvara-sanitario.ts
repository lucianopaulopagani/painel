import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  AlvaraSanitarioInput,
  AlvaraSanitarioRecord,
} from "@/lib/types";

export const alvaraSanitarioKeys = {
  all: ["alvara-sanitario"] as const,
  byAno: (ano: string) => ["alvara-sanitario", ano] as const,
};

export function useAlvaraSanitario(ano: string) {
  return useQuery({
    queryKey: alvaraSanitarioKeys.byAno(ano),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alvara_sanitario")
        .select("*")
        .eq("ano", ano);
      if (error) throw error;
      return data as AlvaraSanitarioRecord[];
    },
  });
}

export function useAlvaraSanitarioAll() {
  return useQuery({
    queryKey: ["alvara-sanitario", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase.from("alvara_sanitario").select("*");
      if (error) throw error;
      return data as AlvaraSanitarioRecord[];
    },
  });
}

export function useSaveAlvaraSanitario(ano: string) {
  const queryClient = useQueryClient();
  const queryKey = alvaraSanitarioKeys.byAno(ano);

  return useMutation({
    mutationFn: async (record: AlvaraSanitarioInput) => {
      const { error } = await supabase.from("alvara_sanitario").upsert(
        { ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,ano" }
      );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<AlvaraSanitarioRecord[]>(queryKey) ?? [];
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
      queryClient.invalidateQueries({ queryKey: alvaraSanitarioKeys.all }),
  });
}
