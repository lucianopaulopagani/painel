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

/** Extrai a mensagem devolvida pela função de backend quando a chamada falha. */
async function readFunctionError(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response }).context;
  if (!context || typeof context.json !== "function") return null;
  try {
    const payload = (await context.json()) as { error?: string };
    return payload?.error ?? null;
  } catch {
    return null;
  }
}

/** Chama a função "manage-users" e já normaliza erros de comunicação. */
async function invokeManageUsers<T extends FunctionResponse>(
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("manage-users", {
    body,
  });
  if (error) {
    const message = await readFunctionError(error);
    throw new Error(message ?? "Falha de comunicação com o servidor de usuários.");
  }
  return data as T;
}

/** Verifica se já existe pelo menos um administrador no sistema (bootstrap do primeiro admin). */
export function useHasAdmin() {
  return useQuery({
    queryKey: ["has-admin"] as const,
    queryFn: async () => {
      try {
        const data = await invokeManageUsers<
          FunctionResponse & { has_admin?: boolean }
        >({ action: "has-admin" });
        return data.has_admin ?? true;
      } catch {
        // Se a função não responder, esconde o fluxo de setup.
        return true;
      }
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
      const data = await invokeManageUsers<FunctionResponse>({
        action: "create-user",
        ...input,
      });
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
      const data = await invokeManageUsers<FunctionResponse>({
        action: "update-user",
        ...input,
      });
      if (!data?.ok) {
        throw new Error(data?.error ?? "Não foi possível atualizar o usuário.");
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profilesKeys.all }),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const data = await invokeManageUsers<FunctionResponse>({
        action: "reset-password",
        id,
        password,
      });
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
      const data = await invokeManageUsers<FunctionResponse>({
        action: "delete-user",
        id,
      });
      if (!data?.ok) {
        throw new Error(data?.error ?? "Não foi possível excluir o usuário.");
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: profilesKeys.all }),
  });
}
