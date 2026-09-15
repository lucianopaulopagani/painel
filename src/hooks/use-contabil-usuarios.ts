import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ContabilUsuario {
  id: string;
  full_name: string;
}

/** Usuários do departamento Contábil (função security definer). */
export function useContabilUsuarios() {
  return useQuery({
    queryKey: ["contabil-usuarios"] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("contabil_usuarios");
      if (error) throw error;
      return (data ?? []) as ContabilUsuario[];
    },
  });
}
