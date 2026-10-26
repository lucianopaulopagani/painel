import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTributacoes } from "@/hooks/use-tributacoes";
import type { TributacaoStatus } from "@/lib/types";

export const tributacaoStatusKeys = {
  all: ["tributacao-status"] as const,
};

/** Cores disponíveis para os status (tons do design system). */
export const STATUS_COLOR_OPTIONS = [
  {
    key: "success",
    label: "Verde",
    className:
      "bg-status-success text-status-success-foreground hover:bg-status-success/90",
    swatch: "bg-status-success",
  },
  {
    key: "info",
    label: "Azul",
    className:
      "bg-status-info text-status-info-foreground hover:bg-status-info/90",
    swatch: "bg-status-info",
  },
  {
    key: "warning",
    label: "Âmbar",
    className:
      "bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
    swatch: "bg-status-warning",
  },
  {
    key: "danger",
    label: "Vermelho",
    className:
      "bg-status-danger text-status-danger-foreground hover:bg-status-danger/90",
    swatch: "bg-status-danger",
  },
  {
    key: "neutral",
    label: "Cinza",
    className: "bg-muted text-muted-foreground hover:bg-muted/80",
    swatch: "bg-muted",
  },
  {
    key: "disabled",
    label: "Roxo",
    className:
      "bg-status-disabled text-status-disabled-foreground hover:bg-status-disabled/90",
    swatch: "bg-status-disabled",
  },
] as const;

/** Classe Tailwind (fundo + texto) da cor do status. */
export function statusColorClass(cor: string | null | undefined): string {
  return (
    STATUS_COLOR_OPTIONS.find((option) => option.key === cor)?.className ??
    "bg-muted text-muted-foreground hover:bg-muted/80"
  );
}

/** Opções de Status cadastradas para cada tributação. */
export function useTributacaoStatus() {
  return useQuery({
    queryKey: tributacaoStatusKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tributacao_status")
        .select("*")
        .order("ordem")
        .order("nome");
      if (error) throw error;
      return data as TributacaoStatus[];
    },
  });
}

/**
 * Opções de Status por nome de tributação (ordem de cadastro).
 * A função devolve a lista cadastrada ou, quando não há nenhuma, a lista padrão
 * da tabela do Movimento Fiscal.
 */
export function useStatusOptions() {
  const { data: tributacoes } = useTributacoes();
  const { data: statuses } = useTributacaoStatus();

  const nameById = new Map(
    (tributacoes ?? []).map((tributacao) => [tributacao.id, tributacao.nome])
  );
  const byTributacao = new Map<string, string[]>();
  for (const status of statuses ?? []) {
    const nome = nameById.get(status.tributacao_id);
    if (!nome) continue;
    const list = byTributacao.get(nome) ?? [];
    list.push(status.nome);
    byTributacao.set(nome, list);
  }

  return (
    tributacao: string | null | undefined,
    fallback: readonly string[]
  ): readonly string[] => {
    if (!tributacao) return fallback;
    const options = byTributacao.get(tributacao);
    return options && options.length > 0 ? options : fallback;
  };
}

/**
 * Classe de cor cadastrada para um status da tributação informada
 * (undefined quando o status não está cadastrado — a tabela usa o tom padrão).
 */
export function useStatusTone() {
  const { data: tributacoes } = useTributacoes();
  const { data: statuses } = useTributacaoStatus();

  const nameById = new Map(
    (tributacoes ?? []).map((tributacao) => [tributacao.id, tributacao.nome])
  );
  const toneByKey = new Map<string, string>();
  for (const status of statuses ?? []) {
    const nome = nameById.get(status.tributacao_id);
    if (!nome) continue;
    toneByKey.set(
      `${nome}\u0000${status.nome.trim().toUpperCase()}`,
      statusColorClass(status.cor)
    );
  }

  return (
    tributacao: string | null | undefined,
    value: string | null | undefined
  ): string | undefined => {
    if (!tributacao || !value) return undefined;
    return toneByKey.get(
      `${tributacao}\u0000${value.trim().toUpperCase()}`
    );
  };
}

export function useCreateTributacaoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tributacao_id,
      nome,
      cor,
    }: {
      tributacao_id: string;
      nome: string;
      cor?: string;
    }) => {
      const { error } = await supabase
        .from("tributacao_status")
        .insert({ tributacao_id, nome: nome.trim(), cor: cor ?? "neutral" });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tributacaoStatusKeys.all }),
  });
}

export function useUpdateTributacaoStatus() {
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
        .from("tributacao_status")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tributacaoStatusKeys.all }),
  });
}

export function useDeleteTributacaoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tributacao_status")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tributacaoStatusKeys.all }),
  });
}
