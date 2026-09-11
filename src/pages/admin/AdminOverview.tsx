import { Building2, Loader2, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDepartments } from "@/hooks/use-departments";
import { useUsers } from "@/hooks/use-users";

export default function AdminOverview() {
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
  } = useUsers();
  const {
    data: departments,
    isLoading: departmentsLoading,
    isError: departmentsError,
  } = useDepartments();

  if (usersLoading || departmentsLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (usersError || departmentsError) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        Não foi possível carregar as métricas do sistema.
      </p>
    );
  }

  const userList = users ?? [];
  const departmentList = departments ?? [];
  const adminCount = userList.filter((u) => u.role === "admin").length;

  const counts = new Map<string, number>();
  for (const user of userList) {
    if (user.departments.length === 0) {
      counts.set("Sem departamento", (counts.get("Sem departamento") ?? 0) + 1);
      continue;
    }
    for (const department of user.departments) {
      counts.set(department.name, (counts.get(department.name) ?? 0) + 1);
    }
  }
  const byDepartment = Array.from(counts.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], "pt-BR")
  );

  const metrics = [
    { label: "Usuários", value: userList.length, icon: Users },
    { label: "Departamentos", value: departmentList.length, icon: Building2 },
    { label: "Administradores", value: adminCount, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Visão geral</h2>
        <p className="text-sm text-muted-foreground">
          Resumo do sistema e dos acessos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários por departamento</CardTitle>
        </CardHeader>
        <CardContent>
          {byDepartment.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum usuário cadastrado.
            </p>
          ) : (
            <ul className="divide-y">
              {byDepartment.map(([name, count]) => (
                <li
                  key={name}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="text-sm">{name}</span>
                  <Badge variant="secondary">{count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
