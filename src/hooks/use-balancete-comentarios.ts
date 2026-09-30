import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface BalanceteComentarioRow {
  id: string;
  company_id: string;
  ano: string;
  campo: string;
  comentario: string;
}

export const balanceteComentariosKeys = {
  all: ["balancete-comentarios"] as const,
  byAno: (ano: string) => ["balancete-comentarios", ano] as const,
};

/** Comentários (notas estilo Excel) das células do Balancete/Balanço. */
export function useBalanceteComentarios(ano: string) {
  return useQuery({
    queryKey: balanceteComentariosKeys.byAno(ano),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("balancete_comentarios")
        .select("*")
        .eq("ano", ano);
      if (error) throw error;
      return data as BalanceteComentarioRow[];
    },
  });
}

export function useSaveBalanceteComentario(ano: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: {
      company_id: string;
      campo: string;
      comentario: string;
    }) => {
      const { error } = await supabase.from("balancete_comentarios").upsert(
        {
          company_id: record.company_id,
          ano,
          campo: record.campo,
          comentario: record.comentario,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,ano,campo" }
      );
      if (error) throw error;
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: balanceteComentariosKeys.all }),
  });
}

export function useRemoveBalanceteComentario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      campo,
    }: {
      companyId: string;
      campo: string;
    }) => {
      const { error } = await supabase
        .from("balancete_comentarios")
        .delete()
        .eq("company_id", companyId)
        .eq("campo", campo);
      if (error) throw error;
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: balanceteComentariosKeys.all }),
  });
}
