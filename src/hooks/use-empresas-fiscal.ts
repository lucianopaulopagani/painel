import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  EmpresasFiscalInput,
  EmpresasFiscalRecord,
} from "@/lib/types";

export const empresasFiscalKeys = {
  all: ["empresas-fiscal"] as const,
  byMonth: (mes: string) => ["empresas-fiscal", mes] as const,
};

export function useEmpresasFiscal(mes: string) {
  return useQuery({
    queryKey: empresasFiscalKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas_fiscal")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return data as EmpresasFiscalRecord[];
    },
  });
}

/** Todos os registros (usado para manter "Desativado" fixo entre meses). */
export function useEmpresasFiscalAll() {
  return useQuery({
    queryKey: ["empresas-fiscal", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas_fiscal")
        .select("*");
      if (error) throw error;
      return data as EmpresasFiscalRecord[];
    },
  });
}

export function useSaveEmpresasFiscal(mes: string) {
  const queryClient = useQueryClient();
  const queryKey = empresasFiscalKeys.byMonth(mes);

  return useMutation({
    mutationFn: async (record: EmpresasFiscalInput) => {
      const { error } = await supabase.from("empresas_fiscal").upsert(
        { ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,mes_referencia" }
      );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<EmpresasFiscalRecord[]>(queryKey) ?? [];
      const next = [...prev];
      const index = next.findIndex((r) => r.company_id === record.company_id);
      if (index >= 0) {
        next[index] = { ...next[index], ...record };
      } else {
        next.push({
          id: "",
          company_id: record.company_id,
          mes_referencia: mes,
          status: record.status ?? null,
          informacoes: record.informacoes ?? null,
          dctfweb: record.dctfweb ?? null,
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
      queryClient.invalidateQueries({ queryKey: empresasFiscalKeys.all }),
  });
}
