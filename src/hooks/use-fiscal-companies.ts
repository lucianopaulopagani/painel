import { useState } from "react";
import { useAuth } from "@/context/auth";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { useUsers } from "@/hooks/use-users";
import { FISCAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import type { CompanyWithDepartments } from "@/lib/types";

/**
 * Empresas vinculadas ao departamento Fiscal.
 * Admin vê todas (com filtro por responsável); os demais veem apenas as
 * empresas em que são o responsável.
 */
export function useFiscalCompanies() {
  const { profile } = useAuth();
  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: users } = useUsers();
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>("todos");

  const isAdmin = profile?.role === "admin";
  const fiscal = findDepartmentByName(departments, FISCAL_DEPARTMENT_NAME);

  const fiscalLinkOf = (company: CompanyWithDepartments) =>
    fiscal
      ? company.department_links.find((link) => link.department_id === fiscal.id)
      : undefined;

  const fiscalCompanies = (companies ?? []).filter((company) =>
    Boolean(fiscalLinkOf(company))
  );

  const responsibleIds = Array.from(
    new Set(
      fiscalCompanies.flatMap(
        (company) => fiscalLinkOf(company)?.profile_ids ?? []
      )
    )
  );

  const userNameById = new Map(
    (users ?? []).map((user) => [user.id, user.full_name])
  );

  const rows = fiscalCompanies
    .filter((company) => {
      const link = fiscalLinkOf(company);
      if (!link) return false;
      if (isAdmin) {
        return (
          responsavelFiltro === "todos" ||
          link.profile_ids.includes(responsavelFiltro)
        );
      }
      return profile ? link.profile_ids.includes(profile.id) : false;
    })
    .sort((a, b) => {
      if (!a.numero && !b.numero) {
        return a.name.localeCompare(b.name, "pt-BR");
      }
      if (!a.numero) return 1;
      if (!b.numero) return -1;
      return a.numero.localeCompare(b.numero, "pt-BR", { numeric: true });
    });

  return {
    rows,
    isLoading,
    isError,
    isAdmin,
    responsibleIds,
    userNameById,
    responsavelFiltro,
    setResponsavelFiltro,
  };
}
