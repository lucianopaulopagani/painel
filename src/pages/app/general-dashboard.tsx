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
import {
  CONTABIL_DEPARTMENT_NAME,
  FISCAL_DEPARTMENT_NAME,
  NOTA_FISCAL_DEPARTMENT_NAME,
  PESSOAL_DEPARTMENT_NAME,
  SOCIETARIO_DEPARTMENT_NAME,
} from "@/lib/departments";
import { cn } from "@/lib/utils";
import FiscalMovimentoDashboard from "./fiscal/FiscalMovimentoDashboard";
import ContabilDashboard from "./contabil/ContabilDashboard";
import SocietarioDashboard from "./societario/SocietarioDashboard";
import AlvaraLocalizacaoDashboard from "./societario/AlvaraLocalizacaoDashboard";
import AlvaraSanitarioDashboard from "./societario/AlvaraSanitarioDashboard";
import AlvaraBombeirosDashboard from "./societario/AlvaraBombeirosDashboard";

/** Dashboards por departamento — novos dashboards entram nesta lista. */
const DASHBOARDS = [
  { key: "fiscal", label: "Fiscal" },
  { key: "pessoal", label: "Pessoal" },
  { key: "societario", label: "Societário" },
  { key: "contabil", label: "Contábil" },
  { key: "nota-fiscal", label: "Nota Fiscal" },
] as const;

type DashboardKey = (typeof DASHBOARDS)[number]["key"];

/** Nome do departamento de cada dashboard (para filtrar por participação). */
const DASHBOARD_DEPARTMENT: Record<DashboardKey, string> = {
  fiscal: FISCAL_DEPARTMENT_NAME,
  pessoal: PESSOAL_DEPARTMENT_NAME,
  societario: SOCIETARIO_DEPARTMENT_NAME,
  contabil: CONTABIL_DEPARTMENT_NAME,
  "nota-fiscal": NOTA_FISCAL_DEPARTMENT_NAME,
};

/** Submenus (visões) de cada dashboard por departamento. */
const DEPT_SUBMENUS: Record<DashboardKey, { key: string; label: string }[]> = {
  fiscal: [{ key: "dashboard", label: "Movimento Fiscal" }],
  pessoal: [{ key: "dashboard", label: "Dashboard" }],
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
  const userDeptNames = new Set(
    (profile?.departments ?? []).map((department) => department.name)
  );

  // Dashboards visíveis: admin vê todos; senão, os departamentos do usuário.
  const visibleDashboards = DASHBOARDS.filter(
    (dashboard) =>
      isAdmin || userDeptNames.has(DASHBOARD_DEPARTMENT[dashboard.key])
  );

  const [activeDept, setActiveDept] = useState<DashboardKey | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<
    Partial<Record<DashboardKey, string>>
  >({});

  const active = activeDept ?? visibleDashboards[0]?.key ?? null;
  const activeLabel = active
    ? (DASHBOARDS.find((dashboard) => dashboard.key === active)?.label ?? "")
    : "";
  const submenus = active ? DEPT_SUBMENUS[active] : [];
  const submenuKey = active ? (activeSubmenu[active] ?? submenus[0].key) : null;
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
                Você não participa de nenhum departamento com dashboard.
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
