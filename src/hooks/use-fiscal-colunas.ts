import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FiscalColuna } from "@/lib/types";

export const fiscalColunasKeys = {
  all: ["fiscal-colunas"] as const,
};

/** Nomes configurados das colunas do Movimento Fiscal. */
export function useFiscalColunas() {
  return useQuery({
    queryKey: fiscalColunasKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fiscal_colunas")
        .select("*");
      if (error) throw error;
      return data as FiscalColuna[];
    },
  });
}

/**
 * Nome da coluna para exibir no cabeçalho: usa o cadastro na administração e,
 * quando não houver, o rótulo padrão da tabela.
 */
export function useColumnLabel() {
  const { data: colunas } = useFiscalColunas();
  const byCampo = new Map(
    (colunas ?? []).map((coluna) => [coluna.campo, coluna.label])
  );

  return (campo: string, fallback: string): string => {
    const label = byCampo.get(campo);
    return label && label.trim() ? label : fallback;
  };
}

/** Salva o nome de uma coluna (vale para todas as tabelas do Fiscal). */
export function useUpdateColumnLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campo, label }: { campo: string; label: string }) => {
      const { error } = await supabase.from("fiscal_colunas").upsert(
        {
          campo,
          label: label.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "campo" }
      );
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: fiscalColunasKeys.all }),
  });
}
