import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface MovimentoFiscalComentarioRow {
  id: string;
  company_id: string;
  mes_referencia: string;
  campo: string;
  comentario: string;
}

export const movimentoFiscalComentariosKeys = {
  all: ["movimento-fiscal-comentarios"] as const,
  byMonth: (mes: string) => ["movimento-fiscal-comentarios", mes] as const,
};

/** Comentários (notas estilo Excel) das células do Movimento Fiscal. */
export function useMovimentoFiscalComentarios(mes: string) {
  return useQuery({
    queryKey: movimentoFiscalComentariosKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimento_fiscal_comentarios")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return data as MovimentoFiscalComentarioRow[];
    },
  });
}

/**
 * Todos os comentários do Movimento Fiscal — usado para levar o comentário
 * para os meses seguintes até ser alterado ou removido.
 */
export function useAllMovimentoFiscalComentarios() {
  return useQuery({
    queryKey: ["movimento-fiscal-comentarios", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimento_fiscal_comentarios")
        .select("*");
      if (error) throw error;
      return (data ?? []) as MovimentoFiscalComentarioRow[];
    },
  });
}

export function useSaveMovimentoFiscalComentario(mes: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: {
      company_id: string;
      campo: string;
      comentario: string;
    }) => {
      const { error } = await supabase
        .from("movimento_fiscal_comentarios")
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
        queryKey: movimentoFiscalComentariosKeys.all,
      }),
  });
}

export function useRemoveMovimentoFiscalComentario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      companyId,
      campo,
      mes,
    }: {
      companyId: string;
      campo: string;
      mes: string;
    }) => {
      const { error } = await supabase
        .from("movimento_fiscal_comentarios")
        .delete()
        .eq("company_id", companyId)
        .eq("mes_referencia", mes)
        .eq("campo", campo);
      if (error) throw error;
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: movimentoFiscalComentariosKeys.all,
      }),
  });
}
