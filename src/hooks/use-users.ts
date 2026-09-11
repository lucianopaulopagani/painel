import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toProfileWithDepartments, type RawProfileRow } from "@/lib/mappers";
import type { ProfileWithDepartments, Role } from "@/lib/types";

export const profilesKeys = {
  all: ["profiles"] as const,
};

interface FunctionResponse {
  ok: boolean;
  error?: string;
}

/** Verifica se já existe pelo menos um administrador no sistema (bootstrap do primeiro admin). */
export function useHasAdmin() {
  return useQuery({
    queryKey: ["has-admin"] as const,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<
        FunctionResponse & { has_admin?: boolean }
      >("manage-users", { body: { action: "has-admin" } });
      // Se a função não responder, esconde o fluxo de setup.
      if (error || !data?.ok) return true;
      return data.has_admin ?? true;
    },
    staleTime: 30_000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: profilesKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, profile_departments(departments(id, name))")
        .order("full_name");
      if (error) throw error;
      return (data as unknown as RawProfileRow[]).map(toProfileWithDepartments);
    },
  });
}

export interface CreateUserInput {
  full_name: string;
  email: string;
  password: string;
  role: Role;
  department_ids: string[];
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const { data, error } = await supabase.functions.invoke<FunctionResponse>(
        "manage-users",
        { body: { action: "create-user", ...input } }
      );
      if (error) {
        throw new Error("Falha de comunicação com o servidor de usuários.");
      }
      if (!data?.ok) {
        throw new Error(data?.error ?? "Não foi possível criar o usuário.");
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profilesKeys.all }),
  });
}

export interface UpdateUserInput {
  id: string;
  full_name?: string;
  email?: string;
  role?: Role;
  department_ids?: string[];
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const { data, error } = await supabase.functions.invoke<FunctionResponse>(
        "manage-users",
        { body: { action: "update-user", ...input } }
      );
      if (error) {
        throw new Error("Falha de comunicação com o servidor de usuários.");
      }
      if (!data?.ok) {
        throw new Error(data?.error ?? "Não foi possível atualizar o usuário.");
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profilesKeys.all }),
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke<FunctionResponse>(
        "manage-users",
        { body: { action: "reset-password", id, password } }
      );
      if (error) {
        throw new Error("Falha de comunicação com o servidor de usuários.");
      }
      if (!data?.ok) {
        throw new Error(
          data?.error ?? "Não foi possível redefinir a senha do usuário."
        );
      }
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke<FunctionResponse>(
        "manage-users",
        { body: { action: "delete-user", id } }
      );
      if (error) {
        throw new Error("Falha de comunicação com o servidor de usuários.");
      }
      if (!data?.ok) {
        throw new Error(data?.error ?? "Não foi possível excluir o usuário.");
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profilesKeys.all }),
  });
}
