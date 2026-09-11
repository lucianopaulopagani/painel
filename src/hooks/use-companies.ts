import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toCompanyWithDepartments, type RawCompanyRow } from "@/lib/mappers";
import type {
  CompanyDepartmentLink,
  CompanyWithDepartments,
} from "@/lib/types";

export const companiesKeys = {
  all: ["companies"] as const,
};

export function useCompanies() {
  return useQuery({
    queryKey: companiesKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, company_departments(department_id, responsible_profile_ids)")
        .order("numero");
      if (error) throw error;
      return (data as unknown as RawCompanyRow[])
        .map(toCompanyWithDepartments)
        .sort((a, b) => {
          if (!a.numero && !b.numero) {
            return a.name.localeCompare(b.name, "pt-BR");
          }
          if (!a.numero) return 1;
          if (!b.numero) return -1;
          return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
        });
    },
  });
}

export interface CompanyInput {
  numero: string;
  name: string;
  documento: string;
  inscricao_estadual: string | null;
  uf: string;
  department_links: CompanyDepartmentLink[];
}

/** Substitui os vínculos de departamento (e responsáveis) de uma empresa. */
async function replaceCompanyDepartments(
  companyId: string,
  links: CompanyDepartmentLink[]
) {
  const { error: deleteError } = await supabase
    .from("company_departments")
    .delete()
    .eq("company_id", companyId);
  if (deleteError) throw deleteError;

  if (links.length === 0) return;

  const { error: insertError } = await supabase
    .from("company_departments")
    .insert(
      links.map((link) => ({
        company_id: companyId,
        department_id: link.department_id,
        responsible_profile_ids: link.profile_ids,
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
          numero: input.numero.trim() || null,
          name: input.name.trim(),
          documento: input.documento.trim(),
          inscricao_estadual: input.inscricao_estadual?.trim() || null,
          uf: input.uf,
        })
        .select("id")
        .single();
      if (error) throw error;

      await replaceCompanyDepartments(data.id, input.department_links);
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
          numero: input.numero.trim() || null,
          name: input.name.trim(),
          documento: input.documento.trim(),
          inscricao_estadual: input.inscricao_estadual?.trim() || null,
          uf: input.uf,
        })
        .eq("id", id);
      if (error) throw error;

      await replaceCompanyDepartments(id, input.department_links);
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
