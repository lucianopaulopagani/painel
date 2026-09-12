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
  tributacao: string | null;
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
          tributacao: input.tributacao ?? null,
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
          tributacao: input.tributacao ?? null,
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

/** Atualiza em massa vários registros (exceto nome, CNPJ e número). */
export function useBulkUpdateCompanies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      patch,
    }: {
      ids: string[];
      patch: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from("companies")
        .update(patch)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companiesKeys.all }),
  });
}

export interface ImportCompanyItem {
  numero: string;
  name: string;
  documento: string;
  uf: string;
  inscricao_estadual: string | null;
  tributacao: string | null;
  department_ids: string[];
  responsible_ids: string[];
}

/** Importa várias empresas de uma vez (cadastro + vínculos). */
export function useImportCompanies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: ImportCompanyItem[]) => {
      let imported = 0;
      let failed = 0;
      for (const item of items) {
        try {
          const { data, error } = await supabase
            .from("companies")
            .insert({
              numero: item.numero || null,
              name: item.name,
              documento: item.documento,
              inscricao_estadual: item.inscricao_estadual || null,
              uf: item.uf,
              tributacao: item.tributacao ?? null,
            })
            .select("id")
            .single();
          if (error) throw error;

          await replaceCompanyDepartments(
            data.id,
            item.department_ids.map((department_id) => ({
              department_id,
              profile_ids: item.responsible_ids,
            }))
          );
          imported += 1;
        } catch {
          failed += 1;
        }
      }
      return { imported, failed };
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companiesKeys.all }),
  });
}
