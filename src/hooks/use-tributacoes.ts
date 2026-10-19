import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tributacao } from "@/lib/types";

export const tributacoesKeys = {
  all: ["tributacoes"] as const,
};

/** Tributações cadastradas (ordem de exibição e, depois, nome). */
export function useTributacoes() {
  return useQuery({
    queryKey: tributacoesKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tributacoes")
        .select("*")
        .order("ordem")
        .order("nome");
      if (error) throw error;
      return data as Tributacao[];
    },
  });
}

export function useCreateTributacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase
        .from("tributacoes")
        .insert({ nome: nome.trim() });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tributacoesKeys.all }),
  });
}

export function useUpdateTributacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase
        .from("tributacoes")
        .update({ nome: nome.trim() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tributacoesKeys.all }),
  });
}

export function useDeleteTributacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tributacoes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tributacoesKeys.all }),
  });
}
