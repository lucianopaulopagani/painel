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
import { SOCIETARIO_DEPARTMENT_NAME } from "@/lib/departments";
import SocietarioPanel from "./societario/SocietarioPanel";

export default function DepartmentPanel() {
  const { profile } = useAuth();

  if (!profile) return null;

  // Admin e membros do Societário acessam o painel do Societário.
  const hasSocietarioAccess =
    profile.role === "admin" ||
    profile.departments.some((d) => d.name === SOCIETARIO_DEPARTMENT_NAME);

  if (hasSocietarioAccess) {
    return <SocietarioPanel />;
  }

  const firstName =
    profile.full_name.trim().split(/\s+/)[0] || profile.full_name;

  const departmentNames = profile.departments.map((d) => d.name);
  const departmentLabel =
    profile.role === "admin" && departmentNames.length === 0
      ? "Todos os departamentos"
      : departmentNames.length > 0
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
            {profile.role === "admin" && (
              <Link to="/admin">
                <Badge className="text-xs">Administrador</Badge>
              </Link>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {profile.role === "admin" && departmentNames.length === 0
              ? "Você está autenticado(a) como administrador com acesso a todos os departamentos do sistema."
              : `Você está autenticado(a) no sistema com acesso ${
                  departmentNames.length > 1 ? "aos departamentos" : "ao departamento"
                } ${
                  departmentNames.length > 0
                    ? departmentNames.join(", ")
                    : "não definido"
                }.`}
          </p>
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
              <Link to="/admin" className="font-medium text-primary underline-offset-4 hover:underline">
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
