import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PanelHeader } from "@/components/shell/panel-header";
import { useAuth } from "@/context/auth";
import { useDepartments } from "@/hooks/use-departments";
import { useAllDepartmentSubmenus } from "@/hooks/use-department-submenus";
import {
  CONTABIL_DEPARTMENT_NAME,
  FISCAL_DEPARTMENT_NAME,
  NOTA_FISCAL_DEPARTMENT_NAME,
  PESSOAL_DEPARTMENT_NAME,
  SOCIETARIO_DEPARTMENT_NAME,
} from "@/lib/departments";
import { cn } from "@/lib/utils";
import { DepartmentDashboard } from "./DepartmentDashboard";
import FiscalManual from "./FiscalManual";
import NotaFiscalManual from "./NotaFiscalManual";
import GeneralDashboard from "./general-dashboard";
import FiscalDashboard from "./fiscal/FiscalDashboard";
import { MovimentoFiscal as FiscalMovimento } from "./fiscal/MovimentoFiscal";
import BalanceteBalanco from "./contabil/BalanceteBalanco";
import ContabilManual from "./contabil/ContabilManual";
import CertificadoDigital from "./societario/CertificadoDigital";
import SocietarioDashboard from "./societario/SocietarioDashboard";
import SocietarioManual from "./societario/SocietarioManual";
import PessoalManual from "./pessoal/PessoalManual";
import ComplementoInss from "./pessoal/ComplementoInss";
import Domesticas from "./pessoal/Domesticas";
import EmpresasFiscal from "./pessoal/EmpresasFiscal";
import EmpresasFuncionarios from "./pessoal/EmpresasFuncionarios";
import Ponto from "./pessoal/Ponto";

type AvailablePanelKey =
  | "dashboard"
  | "fiscal"
  | "pessoal"
  | "societario"
  | "contabil"
  | "nota-fiscal";

interface ModuleDef {
  key: string;
  label: string;
  render: () => JSX.Element;
}

/** Nome do departamento (cadastro) de cada painel. */
const PANEL_DEPARTMENT_NAME: Record<AvailablePanelKey, string | null> = {
  dashboard: null,
  fiscal: FISCAL_DEPARTMENT_NAME,
  pessoal: PESSOAL_DEPARTMENT_NAME,
  societario: SOCIETARIO_DEPARTMENT_NAME,
  contabil: CONTABIL_DEPARTMENT_NAME,
  "nota-fiscal": NOTA_FISCAL_DEPARTMENT_NAME,
};

/** Renderizador por nome de subdepartamento (novos nomes caem no placeholder). */
const SUBMENU_RENDERERS: Record<string, () => JSX.Element> = {
  "Movimento Fiscal": () => <FiscalMovimento />,
  "Empresas com funcionários": () => <EmpresasFuncionarios />,
  "Empresas Fiscal": () => <EmpresasFiscal />,
  "Domésticas": () => <Domesticas />,
  "Ponto": () => <Ponto />,
  "Complemento INSS": () => <ComplementoInss />,
  "Certificado digital": () => <CertificadoDigital />,
  "Balancete/Balanço": () => <BalanceteBalanco />,
};

const MANUALS: Record<string, () => JSX.Element> = {
  fiscal: () => <FiscalManual />,
  pessoal: () => <PessoalManual />,
  societario: () => <SocietarioManual />,
  contabil: () => <ContabilManual />,
  "nota-fiscal": () => <NotaFiscalManual />,
};

const DASHBOARDS: Record<string, () => JSX.Element> = {
  fiscal: () => <FiscalDashboard />,
  societario: () => <SocietarioDashboard />,
};

export default function DepartmentPanel() {
  const { profile } = useAuth();
  const { data: departments } = useDepartments();
  const { data: allSubmenus } = useAllDepartmentSubmenus();
  const [activePanel, setActivePanel] = useState<AvailablePanelKey | null>(null);
  const [activeModule, setActiveModule] = useState<
    Partial<Record<AvailablePanelKey, string>>
  >({});

  if (!profile) return null;

  const hasFiscalAccess =
    profile.role === "admin" ||
    profile.departments.some((d) => d.name === FISCAL_DEPARTMENT_NAME);
  const hasSocietarioAccess =
    profile.role === "admin" ||
    profile.departments.some((d) => d.name === SOCIETARIO_DEPARTMENT_NAME);
  const hasPessoalAccess =
    profile.role === "admin" ||
    profile.departments.some((d) => d.name === PESSOAL_DEPARTMENT_NAME);
  const hasContabilAccess =
    profile.role === "admin" ||
    profile.departments.some((d) => d.name === CONTABIL_DEPARTMENT_NAME);
  const hasNotaFiscalAccess =
    profile.role === "admin" ||
    profile.departments.some((d) => d.name === NOTA_FISCAL_DEPARTMENT_NAME);

  const availablePanels: { key: AvailablePanelKey; label: string }[] = [
    (profile.role === "admin" || profile.dashboard_access) && {
      key: "dashboard",
      label: "Dashboard geral",
    },
    hasFiscalAccess && { key: "fiscal", label: "Fiscal" },
    hasPessoalAccess && { key: "pessoal", label: "Pessoal" },
    hasSocietarioAccess && { key: "societario", label: "Societário" },
    hasContabilAccess && { key: "contabil", label: "Contábil" },
    hasNotaFiscalAccess && { key: "nota-fiscal", label: "Nota Fiscal" },
  ].filter((panel): panel is { key: AvailablePanelKey; label: string } =>
    Boolean(panel)
  );

  /** Monta os módulos do painel: Dashboard + subdepartamentos (banco) + Manual. */
  const buildModules = (key: AvailablePanelKey, label: string): ModuleDef[] => {
    if (key === "dashboard") {
      return [
        {
          key: "dashboard",
          label: "Dashboard geral",
          render: () => <GeneralDashboard />,
        },
      ];
    }
    const modules: ModuleDef[] = [
      {
        key: "dashboard",
        label: "Dashboard",
        render:
          DASHBOARDS[key] ?? (() => <DepartmentDashboard title={label} />),
      },
    ];
    const deptName = PANEL_DEPARTMENT_NAME[key];
    const deptId = deptName
      ? (departments ?? []).find(
          (department) => department.name === deptName
        )?.id
      : undefined;
    const submenus = (allSubmenus ?? [])
      .filter((submenu) => submenu.department_id === deptId)
      .sort((a, b) => a.position - b.position);
    for (const submenu of submenus) {
      const render = SUBMENU_RENDERERS[submenu.name];
      modules.push({
        key: submenu.id,
        label: submenu.name,
        // Subdepartamentos sem tela própria ficam como "em desenvolvimento".
        render: render ?? (() => <DepartmentDashboard title={submenu.name} />),
      });
    }
    modules.push({
      key: "manual",
      label: "Manual",
      render: MANUALS[key] ?? (() => <DepartmentDashboard title="Manual" />),
    });
    return modules;
  };

  // Nenhum painel disponível: mantém o placeholder original.
  if (availablePanels.length === 0) {
    const firstName =
      profile.full_name.trim().split(/\s+/)[0] || profile.full_name;
    const departmentNames = profile.departments.map((d) => d.name);
    const departmentLabel =
      departmentNames.length > 0
        ? departmentNames.join(", ")
        : "Sem departamento";

    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PanelHeader title="Meu Departamento" subtitle={departmentLabel} />

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Bem-vindo(a), {firstName}
              </h1>
              <Badge variant="secondary" className="text-xs">
                {departmentLabel}
              </Badge>
            </div>
          </div>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-muted-foreground" />
                Painel em desenvolvimento
              </CardTitle>
              <CardDescription>
                As funcionalidades específicas deste painel serão implementadas
                em breve. Esta área está reservada para as ferramentas do
                departamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enquanto isso, você pode navegar para a{" "}
                <Link
                  to="/admin"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  administração
                </Link>{" "}
                (se tiver perfil de administrador) ou sair do sistema.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const active = activePanel ?? availablePanels[0].key;
  const activeLabel =
    availablePanels.find((panel) => panel.key === active)?.label ?? "";
  const modules = buildModules(active, activeLabel);
  const currentModuleKey = activeModule[active] ?? modules[0].key;
  const currentModule =
    modules.find((module) => module.key === currentModuleKey) ?? modules[0];

  const selectDepartment = (key: AvailablePanelKey) => {
    setActivePanel(key);
  };

  const selectModule = (key: AvailablePanelKey, moduleKey: string) => {
    setActivePanel(key);
    setActiveModule((prev) => ({ ...prev, [key]: moduleKey }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader title={activeLabel} subtitle="Painel do departamento" />

      <nav className="relative z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-1 px-4 py-2 sm:px-6">
          {availablePanels.map((panel) => {
            const deptModules = buildModules(panel.key, panel.label);
            return (
              <div key={panel.key} className="group relative shrink-0">
                <button
                  type="button"
                  onClick={() => selectDepartment(panel.key)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active === panel.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {panel.label}
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                </button>

                <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <div className="min-w-56 rounded-md border bg-popover p-1.5 text-popover-foreground shadow-md">
                    {deptModules.map((module) => (
                      <button
                        key={module.key}
                        type="button"
                        onClick={() => selectModule(panel.key, module.key)}
                        className={cn(
                          "flex w-full items-center whitespace-nowrap rounded-sm px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-muted",
                          active === panel.key &&
                            currentModuleKey === module.key &&
                            "bg-muted font-medium"
                        )}
                      >
                        {module.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6">
        {currentModule.render()}
      </main>
    </div>
  );
}
