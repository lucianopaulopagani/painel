import { useState } from "react";
import { ChevronDown, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth";
import { useMeusAcessos } from "@/hooks/use-permissoes";
import { useAllDepartmentSubmenus } from "@/hooks/use-department-submenus";
import { useDepartments } from "@/hooks/use-departments";
import {
  CONTABIL_DEPARTMENT_NAME,
  FISCAL_DEPARTMENT_NAME,
  NOTA_FISCAL_DEPARTMENT_NAME,
  PESSOAL_DEPARTMENT_NAME,
  SOCIETARIO_DEPARTMENT_NAME,
} from "@/lib/departments";
import { DEPARTMENT_DASHBOARDS } from "@/lib/dashboards";
import { cn } from "@/lib/utils";
import FiscalMovimentoDashboard from "./fiscal/FiscalMovimentoDashboard";
import ParcelamentosDashboard from "./fiscal/ParcelamentosDashboard";
import PessoalDashboard from "./pessoal/PessoalDashboard";
import EmpresasFiscalDashboard from "./pessoal/EmpresasFiscalDashboard";
import DomesticasDashboard from "./pessoal/DomesticasDashboard";
import PontoDashboard from "./pessoal/PontoDashboard";
import ComplementoInssDashboard from "./pessoal/ComplementoInssDashboard";
import ContabilDashboard from "./contabil/ContabilDashboard";
import SocietarioDashboard from "./societario/SocietarioDashboard";
import AlvaraLocalizacaoDashboard from "./societario/AlvaraLocalizacaoDashboard";
import AlvaraSanitarioDashboard from "./societario/AlvaraSanitarioDashboard";
import AlvaraBombeirosDashboard from "./societario/AlvaraBombeirosDashboard";

/** Dashboards por departamento — lista canônica em @/lib/dashboards. */
const DASHBOARDS = DEPARTMENT_DASHBOARDS;

/** Submenus (visões) de cada dashboard por departamento. */
const DEPT_SUBMENUS: Record<DashboardKey, { key: string; label: string }[]> = {
  fiscal: [
    { key: "dashboard", label: "Movimento Fiscal" },
    { key: "parcelamentos", label: "Controle de Parcelamentos" },
  ],
  pessoal: [
    { key: "dashboard", label: "Empresas com funcionários" },
    { key: "empresas-fiscal", label: "Empresas Fiscal" },
    { key: "domesticas", label: "Domésticas" },
    { key: "ponto", label: "Ponto" },
    { key: "complemento-inss", label: "Complemento INSS" },
  ],
  societario: [
    { key: "certificado-digital", label: "Certificado digital" },
    { key: "alvara-localizacao", label: "Alvará localização" },
    { key: "alvara-sanitario", label: "Alvará Sanitário" },
    { key: "alvara-bombeiros", label: "Alvará Bombeiros" },
  ],
  contabil: [{ key: "balancete-balanco", label: "Balancete/Balanço" }],
  "nota-fiscal": [{ key: "dashboard", label: "Dashboard" }],
};

export default function GeneralDashboard() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const acessos = useMeusAcessos();
  const { data: allSubmenus } = useAllDepartmentSubmenus();
  const { data: departments } = useDepartments();
  // Dashboard liberado por usuário no cadastro (profiles.dashboard_departments).
  const allowedDashboards = new Set(profile?.dashboard_departments ?? []);

  /** Departamento do cadastro (id) de cada dashboard. */
  const departmentIdByDashboard = (key: DashboardKey) => {
    const nome = {
      fiscal: FISCAL_DEPARTMENT_NAME,
      pessoal: PESSOAL_DEPARTMENT_NAME,
      societario: SOCIETARIO_DEPARTMENT_NAME,
      contabil: CONTABIL_DEPARTMENT_NAME,
      "nota-fiscal": NOTA_FISCAL_DEPARTMENT_NAME,
    }[key];
    return (departments ?? []).find((item) => item.name === nome)?.id;
  };

  /** Departamentos com dashboard geral ou de subdepartamento liberado. */
  const liberadosPorPermissao = new Set<DashboardKey>();
  for (const dashboard of DASHBOARDS) {
    const departmentId = departmentIdByDashboard(dashboard.key);
    const acesso = departmentId
      ? acessos.porDepartamento.get(departmentId)
      : undefined;
    if (acesso && (acesso.dashboardGeral || acesso.dashboards.size > 0)) {
      liberadosPorPermissao.add(dashboard.key);
    }
  }

  // Dashboards visíveis: admin vê todos; demais, os liberados na permissão
  // (ou, sem permissões cadastradas, os liberados no cadastro antigo).
  const visibleDashboards = isAdmin
    ? DASHBOARDS
    : acessos.temPermissoes
      ? DASHBOARDS.filter((dashboard) =>
          liberadosPorPermissao.has(dashboard.key)
        )
      : DASHBOARDS.filter((dashboard) =>
          allowedDashboards.has(dashboard.key)
        );

  /** Nomes dos submenus com dashboard liberado. */
  const submenusLiberados = new Set<string>();
  for (const acesso of acessos.porDepartamento.values()) {
    for (const submenuId of acesso.dashboards) {
      const nome = (allSubmenus ?? []).find(
        (submenu) => submenu.id === submenuId
      )?.name;
      if (nome) submenusLiberados.add(nome);
    }
  }

  const submenusDoDashboard = (key: DashboardKey) => {
    const lista = DEPT_SUBMENUS[key];
    if (isAdmin || !acessos.temPermissoes) return lista;
    return lista.filter((submenu) => submenusLiberados.has(submenu.label));
  };

  const [activeDept, setActiveDept] = useState<DashboardKey | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<
    Partial<Record<DashboardKey, string>>
  >({});

  const active = activeDept ?? visibleDashboards[0]?.key ?? null;
  const activeLabel = active
    ? (DASHBOARDS.find((dashboard) => dashboard.key === active)?.label ?? "")
    : "";
  const submenus = active ? submenusDoDashboard(active) : [];
  const submenuKey = active
    ? (activeSubmenu[active] ?? submenus[0]?.key ?? null)
    : null;
  const submenuLabel =
    submenus.find((submenu) => submenu.key === submenuKey)?.label ?? "";

  const selectSubmenu = (key: string) => {
    if (!active) return;
    setActiveSubmenu((prev) => ({ ...prev, [active]: key }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="group relative">
          <Button type="button" variant="outline" className="gap-2">
            {activeLabel}
            <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
          </Button>

          <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            <div className="min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              {visibleDashboards.map((dashboard) => (
                <button
                  key={dashboard.key}
                  type="button"
                  onClick={() => setActiveDept(dashboard.key)}
                  className={cn(
                    "flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted",
                    active === dashboard.key && "bg-muted font-medium"
                  )}
                >
                  {dashboard.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="group relative">
          <Button type="button" variant="outline" className="gap-2">
            {submenuLabel}
            <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
          </Button>

          <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            <div className="min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              {submenus.map((submenu) => (
                <button
                  key={submenu.key}
                  type="button"
                  onClick={() => selectSubmenu(submenu.key)}
                  className={cn(
                    "flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted",
                    submenuKey === submenu.key && "bg-muted font-medium"
                  )}
                >
                  {submenu.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {active === "fiscal" && submenuKey === "dashboard" ? (
          <FiscalMovimentoDashboard />
        ) : active === "fiscal" && submenuKey === "parcelamentos" ? (
          <ParcelamentosDashboard />
        ) : active === "pessoal" && submenuKey === "dashboard" ? (
          <PessoalDashboard />
        ) : active === "pessoal" && submenuKey === "empresas-fiscal" ? (
          <EmpresasFiscalDashboard />
        ) : active === "pessoal" && submenuKey === "domesticas" ? (
          <DomesticasDashboard />
        ) : active === "pessoal" && submenuKey === "ponto" ? (
          <PontoDashboard />
        ) : active === "pessoal" && submenuKey === "complemento-inss" ? (
          <ComplementoInssDashboard />
        ) : active === "contabil" && submenuKey === "balancete-balanco" ? (
          <ContabilDashboard />
        ) : active === "societario" && submenuKey === "certificado-digital" ? (
          <SocietarioDashboard />
        ) : active === "societario" && submenuKey === "alvara-localizacao" ? (
          <AlvaraLocalizacaoDashboard />
        ) : active === "societario" && submenuKey === "alvara-sanitario" ? (
          <AlvaraSanitarioDashboard />
        ) : active === "societario" && submenuKey === "alvara-bombeiros" ? (
          <AlvaraBombeirosDashboard />
        ) : !active ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-muted-foreground" />
                Sem dashboard disponível
              </CardTitle>
              <CardDescription>
                Nenhum dashboard de departamento está liberado para o seu
                usuário. Fale com o administrador para solicitar o acesso.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-muted-foreground" />
                {activeLabel}
              </CardTitle>
              <CardDescription>
                O dashboard deste departamento será criado futuramente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Área em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
