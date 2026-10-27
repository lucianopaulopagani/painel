import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { statusColorClass } from "@/lib/cadastro-tabelas";
import type { CadastroColuna, CadastroOpcao } from "@/lib/types";

export const cadastroKeys = {
  colunas: ["cadastro-colunas"] as const,
  opcoes: ["cadastro-opcoes"] as const,
};

/** Nomes de colunas cadastrados (todos os departamentos). */
export function useCadastroColunas() {
  return useQuery({
    queryKey: cadastroKeys.colunas,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cadastro_colunas")
        .select("*");
      if (error) throw error;
      return data as CadastroColuna[];
    },
  });
}

/**
 * Nome da coluna no cabeçalho de um departamento: usa o cadastro e, quando não
 * houver, o rótulo padrão da tabela.
 */
export function useCadastroLabels(departamento: string) {
  const { data: colunas } = useCadastroColunas();
  const byCampo = new Map(
    (colunas ?? [])
      .filter((coluna) => coluna.departamento === departamento)
      .map((coluna) => [coluna.campo, coluna.label])
  );

  return (campo: string, fallback: string): string => {
    const label = byCampo.get(campo);
    return label && label.trim() ? label : fallback;
  };
}

/** Salva o nome de uma coluna (vale para as tabelas do departamento). */
export function useUpdateCadastroLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departamento,
      campo,
      label,
    }: {
      departamento: string;
      campo: string;
      label: string;
    }) => {
      const { error } = await supabase.from("cadastro_colunas").upsert(
        {
          departamento,
          campo,
          label: label.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "departamento,campo" }
      );
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cadastroKeys.colunas }),
  });
}

/** Opções de menu suspenso cadastradas (todos os departamentos). */
export function useCadastroOpcoes() {
  return useQuery({
    queryKey: cadastroKeys.opcoes,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cadastro_opcoes")
        .select("*")
        .order("ordem")
        .order("nome");
      if (error) throw error;
      return data as CadastroOpcao[];
    },
  });
}

/**
 * Opções de uma coluna de menu suspenso (por tabela e coluna do departamento).
 * A função devolve a lista cadastrada ou, quando não há nenhuma, a lista padrão
 * da tabela.
 */
export function useCadastroFieldOptions(departamento: string) {
  const { data: opcoes } = useCadastroOpcoes();

  const byKey = new Map<string, string[]>();
  for (const opcao of opcoes ?? []) {
    if (opcao.departamento !== departamento) continue;
    const key = `${opcao.tabela}\u0000${opcao.campo}`;
    const list = byKey.get(key) ?? [];
    list.push(opcao.nome);
    byKey.set(key, list);
  }

  return (
    tabela: string | null | undefined,
    campo: string,
    fallback: readonly string[]
  ): readonly string[] => {
    if (!tabela) return fallback;
    const options = byKey.get(`${tabela}\u0000${campo}`);
    return options && options.length > 0 ? options : fallback;
  };
}

/**
 * Classe de cor cadastrada para uma opção de uma coluna da tabela informada
 * (undefined quando não há cadastro — a tabela usa o tom padrão).
 */
export function useCadastroFieldTone(departamento: string) {
  const { data: opcoes } = useCadastroOpcoes();

  const toneByKey = new Map<string, string>();
  for (const opcao of opcoes ?? []) {
    if (opcao.departamento !== departamento) continue;
    toneByKey.set(
      `${opcao.tabela}\u0000${opcao.campo}\u0000${opcao.nome.trim().toUpperCase()}`,
      statusColorClass(opcao.cor)
    );
  }

  return (
    tabela: string | null | undefined,
    campo: string,
    value: string | null | undefined
  ): string | undefined => {
    if (!tabela || !value) return undefined;
    return toneByKey.get(
      `${tabela}\u0000${campo}\u0000${value.trim().toUpperCase()}`
    );
  };
}

export function useCreateCadastroOpcao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departamento,
      tabela,
      campo,
      nome,
      cor,
    }: {
      departamento: string;
      tabela: string;
      campo: string;
      nome: string;
      cor?: string;
    }) => {
      const { error } = await supabase.from("cadastro_opcoes").insert({
        departamento,
        tabela,
        campo,
        nome: nome.trim(),
        cor: cor ?? "neutral",
      });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cadastroKeys.opcoes }),
  });
}

export function useUpdateCadastroOpcao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      nome,
      cor,
    }: {
      id: string;
      nome?: string;
      cor?: string;
    }) => {
      const patch: { nome?: string; cor?: string } = {};
      if (nome !== undefined) patch.nome = nome.trim();
      if (cor !== undefined) patch.cor = cor;
      const { error } = await supabase
        .from("cadastro_opcoes")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cadastroKeys.opcoes }),
  });
}

export function useDeleteCadastroOpcao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cadastro_opcoes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cadastroKeys.opcoes }),
  });
}

/** Leva as opções cadastradas para o novo nome quando uma tabela é renomeada. */
export function useRenameCadastroTabela() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departamento,
      de,
      para,
    }: {
      departamento: string;
      de: string;
      para: string;
    }) => {
      const { error } = await supabase
        .from("cadastro_opcoes")
        .update({ tabela: para })
        .eq("departamento", departamento)
        .eq("tabela", de);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cadastroKeys.opcoes }),
  });
}

/** Remove as opções cadastradas de uma tabela excluída. */
export function useDeleteCadastroTabela() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departamento,
      tabela,
    }: {
      departamento: string;
      tabela: string;
    }) => {
      const { error } = await supabase
        .from("cadastro_opcoes")
        .delete()
        .eq("departamento", departamento)
        .eq("tabela", tabela);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: cadastroKeys.opcoes }),
  });
}
