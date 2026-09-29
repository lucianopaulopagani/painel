import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DirectoryUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

/** Diretório de usuários (nomes para filtros e gráficos). */
export function usePeopleDirectory() {
  return useQuery({
    queryKey: ["people-directory"] as const,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("people_directory");
      if (error) throw error;
      return (data ?? []) as DirectoryUser[];
    },
  });
}
