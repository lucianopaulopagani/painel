import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AllUser {
  id: string;
  full_name: string;
}

export interface AllUserWithDepartments extends AllUser {
  department_ids: string[];
}

/** Todos os usuários (admin ou quem tem permissão de empresas). */
export function useAllUsers() {
  return useQuery({
    queryKey: ["all-users"] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("all_users");
      if (error) throw error;
      return (data ?? []) as AllUser[];
    },
  });
}

/** Todos os usuários com a lista de departamentos a que pertencem. */
export function useAllUsersWithDepartments() {
  return useQuery({
    queryKey: ["all-users-departments"] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("all_users_departments");
      if (error) throw error;
      return (data ?? []) as AllUserWithDepartments[];
    },
  });
}
