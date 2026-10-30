import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth";
import {
  resolverAcessos,
  type Acessos,
  type PermissaoRegistro,
} from "@/lib/permissoes";

export interface Permissao {
  id: string;
  nome: string;
  descricao: string | null;
  department_id: string | null;
  opcoes: string[];
  created_at: string;
  updated_at: string;
}

export const vinculosKey = ["perfil-permissoes"] as const;

export const permissoesKeys = {
  all: ["permissoes"] as const,
  doUsuario: (profileId: string) =>
    ["permissoes", "usuario", profileId] as const,
};

export function usePermissoes() {
  return useQuery({
    queryKey: permissoesKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissoes")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Permissao[];
    },
  });
}

export interface PermissaoInput {
  nome: string;
  descricao: string | null;
  opcoes: string[];
  department_id: string | null;
}

/** Permissões do usuário logado, já resolvidas em acessos por departamento. */
export function useMeusAcessos(): Acessos {
  const { profile } = useAuth();
  const { data } = useQuery({
    queryKey: ["meus-acessos", profile?.id ?? ""],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      // Função no backend devolve as permissões do usuário logado sem depender
      // das políticas de leitura das tabelas.
      const { data, error } = await supabase.rpc("minhas_permissoes");
      if (error) throw error;
      return ((data ?? []) as {
        permissao_id: string;
        nome: string;
        department_id: string | null;
        opcoes: string[];
      }[]).map<PermissaoRegistro>((row) => ({
        id: row.permissao_id,
        nome: row.nome,
        descricao: null,
        opcoes: row.opcoes ?? [],
        department_id: row.department_id,
      }));
    },
  });

  return useMemo(() => resolverAcessos(data ?? []), [data]);
}

export function useCreatePermissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PermissaoInput) => {
      const { data, error } = await supabase
        .from("permissoes")
        .insert({ ...input })
        .select("id")
        .single();
      if (error) throw error;
      return data?.id as string | undefined;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: permissoesKeys.all }),
  });
}

export function useUpdatePermissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PermissaoInput & { id: string }) => {
      const { id, ...rest } = input;
      const { error } = await supabase
        .from("permissoes")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: permissoesKeys.all }),
  });
}

export function useDeletePermissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("permissoes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: permissoesKeys.all }),
  });
}

/** Ids das permissões vinculadas a um usuário. */
export function usePermissoesDoUsuario(profileId: string | null | undefined) {
  return useQuery({
    queryKey: permissoesKeys.doUsuario(profileId ?? ""),
    enabled: Boolean(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfil_permissoes")
        .select("permissao_id")
        .eq("profile_id", profileId as string);
      if (error) throw error;
      return (data ?? []).map((row) => row.permissao_id);
    },
  });
}

export interface VinculoPermissao {
  profile_id: string;
  permissao_id: string;
}

/** Todos os vínculos usuário × permissão (usado na listagem de usuários). */
export function useVinculosPermissoes() {
  return useQuery({
    queryKey: vinculosKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfil_permissoes")
        .select("profile_id, permissao_id");
      if (error) throw error;
      return (data ?? []) as VinculoPermissao[];
    },
  });
}

/** Substitui as permissões do usuário pela lista informada. */
export async function salvarPermissoesDoUsuario(
  profileId: string,
  permissaoIds: string[]
): Promise<void> {
  const { error: erroRemover } = await supabase
    .from("perfil_permissoes")
    .delete()
    .eq("profile_id", profileId);
  if (erroRemover) throw erroRemover;

  if (permissaoIds.length === 0) return;

  const { error } = await supabase.from("perfil_permissoes").insert(
    permissaoIds.map((permissaoId) => ({
      profile_id: profileId,
      permissao_id: permissaoId,
    }))
  );
  if (error) throw error;
}
