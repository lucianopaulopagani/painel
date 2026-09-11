import { useState } from "react";
import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
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
import {
  FISCAL_DEPARTMENT_NAME,
  SOCIETARIO_DEPARTMENT_NAME,
} from "@/lib/departments";
import { cn } from "@/lib/utils";
import FiscalPanel from "./fiscal/FiscalPanel";
import SocietarioPanel from "./societario/SocietarioPanel";

interface AvailablePanel {
  key: "fiscal" | "societario";
  label: string;
  panel: JSX.Element;
}

export default function DepartmentPanel() {
  const { profile } = useAuth();
  const [activePanel, setActivePanel] = useState<AvailablePanel["key"] | null>(
    null
  );

  if (!profile) return null;

  const hasFiscalAccess =
    profile.role === "admin" ||
    profile.departments.some((d) => d.name === FISCAL_DEPARTMENT_NAME);
  const hasSocietarioAccess =
    profile.role === "admin" ||
    profile.departments.some((d) => d.name === SOCIETARIO_DEPARTMENT_NAME);

  const availablePanels: AvailablePanel[] = [
    hasFiscalAccess && {
      key: "fiscal",
      label: "Fiscal",
      panel: <FiscalPanel />,
    },
    hasSocietarioAccess && {
      key: "societario",
      label: "Societário",
      panel: <SocietarioPanel />,
    },
  ].filter((panel): panel is AvailablePanel => Boolean(panel));

  // Nenhum painel específico disponível: mantém o placeholder original.
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

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
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

  // Um único painel: renderiza direto.
  if (availablePanels.length === 1) {
    return availablePanels[0].panel;
  }

  // Vários painéis disponíveis: barra para escolher.
  const active = activePanel ?? availablePanels[0].key;
  const current =
    availablePanels.find((panel) => panel.key === active) ??
    availablePanels[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {availablePanels.map((panel) => (
            <button
              key={panel.key}
              type="button"
              onClick={() => setActivePanel(panel.key)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active === panel.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {panel.label}
            </button>
          ))}
        </div>
      </div>
      {current.panel}
    </div>
  );
}
