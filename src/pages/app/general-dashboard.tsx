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

  // Admin, permissão com "Acesso aos dashboards" ou usuário sem permissões
  // cadastradas veem todos os dashboards. Só fica oculto quando o usuário tem
  // permissões e nenhuma delas libera os dashboards.
  const dashboardsLiberados =
    isAdmin || acessos.dashboards || !acessos.temPermissoes;
  const visibleDashboards = dashboardsLiberados ? DASHBOARDS : [];

  const [activeDept, setActiveDept] = useState<DashboardKey | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<
    Partial<Record<DashboardKey, string>>
  >({});

  const active = activeDept ?? visibleDashboards[0]?.key ?? null;
  const activeLabel = active
    ? (DASHBOARDS.find((dashboard) => dashboard.key === active)?.label ?? "")
    : "";
  const submenus = active ? DEPT_SUBMENUS[active] : [];
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
