import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Department } from "@/lib/types";

export const departmentsKeys = {
  all: ["departments"] as const,
  detail: (id: string) => ["departments", id] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentsKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Department[];
    },
  });
}

export function useDepartment(id?: string) {
  return useQuery({
    queryKey: departmentsKeys.detail(id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Department;
    },
    enabled: !!id,
  });
}

interface DepartmentInput {
  name: string;
  description?: string;
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: DepartmentInput) => {
      const { error } = await supabase.from("departments").insert({
        name: name.trim(),
        description: description?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all }),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: DepartmentInput & { id: string }) => {
      const { error } = await supabase
        .from("departments")
        .update({
          name: name.trim(),
          description: description?.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: departmentsKeys.all }),
  });
}
