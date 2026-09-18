import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/** Subdepartamentos liberados para o usuário logado (via RLS: apenas os seus). */
export function useMySubmenuIds() {
  return useQuery({
    queryKey: ["my-submenus"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_submenus")
        .select("submenu_id");
      if (error) throw error;
      return ((data ?? []) as { submenu_id: string }[]).map(
        (row) => row.submenu_id
      );
    },
  });
}
