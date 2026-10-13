import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface EmpresasFuncionariosComentarioRow {
  id: string;
  company_id: string;
  mes_referencia: string;
  campo: string;
  comentario: string;
}

export const empresasFuncionariosComentariosKeys = {
  all: ["empresas-funcionarios-comentarios"] as const,
  byMonth: (mes: string) => ["empresas-funcionarios-comentarios", mes] as const,
};

/** Anotações (notas estilo Excel) das células de Empresas com funcionários. */
export function useEmpresasFuncionariosComentarios(mes: string) {
  return useQuery({
    queryKey: empresasFuncionariosComentariosKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas_funcionarios_comentarios")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return (data ?? []) as EmpresasFuncionariosComentarioRow[];
    },
  });
}

/**
 * Todas as anotações — usado para levar a anotação para os meses seguintes até
 * ser alterada ou removida.
 */
export function useAllEmpresasFuncionariosComentarios() {
  return useQuery({
    queryKey: ["empresas-funcionarios-comentarios", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas_funcionarios_comentarios")
        .select("*");
      if (error) throw error;
      return (data ?? []) as EmpresasFuncionariosComentarioRow[];
    },
  });
}

export function useSaveEmpresasFuncionariosComentario(mes: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: {
      company_id: string;
      campo: string;
      comentario: string;
    }) => {
      const { error } = await supabase
        .from("empresas_funcionarios_comentarios")
        .upsert(
          {
            company_id: record.company_id,
            mes_referencia: mes,
            campo: record.campo,
            comentario: record.comentario,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "company_id,mes_referencia,campo" }
        );
      if (error) throw error;
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: empresasFuncionariosComentariosKeys.all,
      }),
  });
}
