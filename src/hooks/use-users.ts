import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProfileWithDepartment, Role } from "@/lib/types";

export const profilesKeys = {
  all: ["profiles"] as const,
};

interface FunctionResponse {
  ok: boolean;
  error?: string;
}

export function useUsers() {
  return useQuery({
    queryKey: profilesKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, departments(id, name)")
        .order("full_name");
      if (error) throw error;
      return data as ProfileWithDepartment[];
    },
  });
}

export interface CreateUserInput {
  full_name: string;
  email: string;
  password: string;
  role: Role;
  department_id: string | null;
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
  department_id?: string | null;
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
