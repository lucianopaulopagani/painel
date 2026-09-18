import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DepartmentSubmenu {
  id: string;
  department_id: string;
  name: string;
  position: number;
  created_at: string;
}

export const departmentSubmenusKeys = {
  all: ["department-submenus"] as const,
};

/** Todos os subdepartamentos (todos os departamentos), em ordem. */
export function useAllDepartmentSubmenus() {
  return useQuery({
    queryKey: departmentSubmenusKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_submenus")
        .select("*")
        .order("department_id")
        .order("position");
      if (error) throw error;
      return data as DepartmentSubmenu[];
    },
  });
}

/** Subdepartamentos de um departamento específico. */
export function useDepartmentSubmenus(departmentId: string) {
  return useQuery({
    queryKey: [...departmentSubmenusKeys.all, departmentId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_submenus")
        .select("*")
        .eq("department_id", departmentId)
        .order("position");
      if (error) throw error;
      return data as DepartmentSubmenu[];
    },
    enabled: departmentId.length > 0,
  });
}

/** Cria um subdepartamento (posição = fim da lista). */
export function useCreateDepartmentSubmenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      department_id,
      name,
    }: {
      department_id: string;
      name: string;
    }) => {
      const { count, error: countError } = await supabase
        .from("department_submenus")
        .select("id", { count: "exact", head: true })
        .eq("department_id", department_id);
      if (countError) throw countError;
      const { error } = await supabase.from("department_submenus").insert({
        department_id,
        name,
        position: count ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: departmentSubmenusKeys.all }),
  });
}

/** Remove um subdepartamento. */
export function useDeleteDepartmentSubmenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("department_submenus")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: departmentSubmenusKeys.all }),
  });
}
