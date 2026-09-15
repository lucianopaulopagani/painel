import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AllUser {
  id: string;
  full_name: string;
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
