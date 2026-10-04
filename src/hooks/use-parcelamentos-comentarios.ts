import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ParcelamentoComentarioRecord } from "@/lib/types";

export const parcelamentoComentariosKeys = {
  all: ["parcelamento-comentarios"] as const,
  byMonth: (mes: string) => ["parcelamento-comentarios", mes] as const,
};

/** Comentários das células do mês de referência. */
export function useParcelamentoComentarios(mes: string) {
  return useQuery({
    queryKey: parcelamentoComentariosKeys.byMonth(mes),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelamentos_comentarios")
        .select("*")
        .eq("mes_referencia", mes);
      if (error) throw error;
      return (data ?? []) as ParcelamentoComentarioRecord[];
    },
  });
}

/**
 * Todos os comentários — usado para levar o comentário para os meses seguintes
 * até ser alterado ou removido.
 */
export function useAllParcelamentoComentarios() {
  return useQuery({
    queryKey: ["parcelamento-comentarios", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelamentos_comentarios")
        .select("*");
      if (error) throw error;
      return (data ?? []) as ParcelamentoComentarioRecord[];
    },
  });
}

export function useSaveParcelamentoComentario(mes: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: {
      company_id: string;
      campo: string;
      comentario: string;
    }) => {
      const { error } = await supabase
        .from("parcelamentos_comentarios")
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
        queryKey: parcelamentoComentariosKeys.all,
      }),
  });
}
