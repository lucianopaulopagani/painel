import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toCompanyWithDepartments, type RawCompanyRow } from "@/lib/mappers";
import type { CompanyWithDepartments } from "@/lib/types";

export const companiesKeys = {
  all: ["companies"] as const,
};

export function useCompanies() {
  return useQuery({
    queryKey: companiesKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, company_departments(department_id)")
        .order("name");
      if (error) throw error;
      return (data as unknown as RawCompanyRow[]).map(
        toCompanyWithDepartments
      );
    },
  });
}

export interface CompanyInput {
  numero: string;
  name: string;
  documento: string;
  inscricao_estadual: string | null;
  ufs: string[];
  department_ids: string[];
}

/** Substitui os vínculos de departamento de uma empresa. */
async function replaceCompanyDepartments(
  companyId: string,
  departmentIds: string[]
) {
  const { error: deleteError } = await supabase
    .from("company_departments")
    .delete()
    .eq("company_id", companyId);
  if (deleteError) throw deleteError;

  if (departmentIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("company_departments")
    .insert(
      departmentIds.map((departmentId) => ({
        company_id: companyId,
        department_id: departmentId,
      }))
    );
  if (insertError) throw insertError;
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CompanyInput) => {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          numero: input.numero.trim(),
          name: input.name.trim(),
          documento: input.documento.trim(),
          inscricao_estadual: input.inscricao_estadual?.trim() || null,
          ufs: input.ufs,
        })
        .select("id")
        .single();
      if (error) throw error;

      await replaceCompanyDepartments(data.id, input.department_ids);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companiesKeys.all }),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CompanyInput & { id: string }) => {
      const { error } = await supabase
        .from("companies")
        .update({
          numero: input.numero.trim(),
          name: input.name.trim(),
          documento: input.documento.trim(),
          inscricao_estadual: input.inscricao_estadual?.trim() || null,
          ufs: input.ufs,
        })
        .eq("id", id);
      if (error) throw error;

      await replaceCompanyDepartments(id, input.department_ids);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companiesKeys.all }),
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companiesKeys.all }),
  });
}
