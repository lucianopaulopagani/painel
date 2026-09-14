import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  BalanceteBalancoInput,
  BalanceteBalancoRecord,
} from "@/lib/types";

export const balanceteKeys = {
  all: ["balancete-balanco"] as const,
  byAno: (ano: string) => ["balancete-balanco", ano] as const,
};

export function useBalanceteBalanco(ano: string) {
  return useQuery({
    queryKey: balanceteKeys.byAno(ano),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("balancete_balanco")
        .select("*")
        .eq("ano", ano);
      if (error) throw error;
      return data as BalanceteBalancoRecord[];
    },
  });
}

export function useSaveBalanceteBalanco(ano: string) {
  const queryClient = useQueryClient();
  const queryKey = balanceteKeys.byAno(ano);

  return useMutation({
    mutationFn: async (record: BalanceteBalancoInput) => {
      const { error } = await supabase.from("balancete_balanco").upsert(
        { ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,ano" }
      );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<BalanceteBalancoRecord[]>(queryKey) ?? [];
      const next = [...prev];
      const index = next.findIndex((r) => r.company_id === record.company_id);
      if (index >= 0) {
        next[index] = { ...next[index], ...record };
      } else {
        next.push({
          id: "",
          company_id: record.company_id,
          ano,
          jan: record.jan ?? null,
          fev: record.fev ?? null,
          mar: record.mar ?? null,
          abr: record.abr ?? null,
          mai: record.mai ?? null,
          jun: record.jun ?? null,
          jul: record.jul ?? null,
          ago: record.ago ?? null,
          set: record.set ?? null,
          out: record.out ?? null,
          nov: record.nov ?? null,
          dez: record.dez ?? null,
          fechamento: record.fechamento ?? null,
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
      queryClient.invalidateQueries({ queryKey: balanceteKeys.all }),
  });
}
