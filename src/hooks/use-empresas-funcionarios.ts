import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  EmpresasFuncionariosInput,
  EmpresasFuncionariosRecord,
} from "@/lib/types";

export const empresasFuncionariosKeys = {
  all: ["empresas-funcionarios"] as const,
  byMonth: (mes: string) => ["empresas-funcionarios", mes] as const,
};

export function useEmpresasFuncionarios(mes: string) {
  return useQuery({
    queryKey: empresasFuncionariosKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas_funcionarios")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return data as EmpresasFuncionariosRecord[];
    },
  });
}

export function useEmpresasFuncionariosAll() {
  return useQuery({
    queryKey: ["empresas-funcionarios", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas_funcionarios")
        .select("*");
      if (error) throw error;
      return data as EmpresasFuncionariosRecord[];
    },
  });
}

export function useSaveEmpresasFuncionarios(mes: string) {
  const queryClient = useQueryClient();
  const queryKey = empresasFuncionariosKeys.byMonth(mes);

  return useMutation({
    mutationFn: async (record: EmpresasFuncionariosInput) => {
      const { error } = await supabase.from("empresas_funcionarios").upsert(
        { ...record, updated_at: new Date().toISOString() },
        { onConflict: "company_id,mes_referencia" }
      );
      if (error) throw error;
    },
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey });
      const prev =
        queryClient.getQueryData<EmpresasFuncionariosRecord[]>(queryKey) ?? [];
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
          data_base: record.data_base ?? null,
          folha: record.folha ?? null,
          emprestimo: record.emprestimo ?? null,
          fgts: record.fgts ?? null,
          taxa_sindical: record.taxa_sindical ?? null,
          dctfweb: record.dctfweb ?? null,
          envio: record.envio ?? null,
          observacao: record.observacao ?? null,
          info_sindicato: record.info_sindicato ?? null,
          info_sindicato_patronal: record.info_sindicato_patronal ?? null,
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
      queryClient.invalidateQueries({
        queryKey: empresasFuncionariosKeys.all,
      }),
  });
}
