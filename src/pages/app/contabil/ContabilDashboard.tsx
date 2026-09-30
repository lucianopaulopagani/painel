import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBalanceteBalanco } from "@/hooks/use-balancete-balanco";
import { useCompanies } from "@/hooks/use-companies";
import { useContabilUsuarios } from "@/hooks/use-contabil-usuarios";
import { useDepartments } from "@/hooks/use-departments";
import { CONTABIL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { companyUsesSubmenu } from "@/lib/department-submenus";
import {
  balanceteAnos,
  BALANCETE_MESES,
  readStoredBalanceteAno,
  writeStoredBalanceteAno,
} from "@/lib/contabil";
import { cn } from "@/lib/utils";
import type { BalanceteBalancoRecord, CompanyWithDepartments } from "@/lib/types";

const SEM_RESPONSAVEL = "Sem responsável";
const TODOS_OS_MESES = "todos";

/**
 * Dashboard do Contábil — mesmo modelo do Movimento Fiscal
 * (cartões com quantidade e porcentagem + gráfico por responsável).
 */
export default function ContabilDashboard() {
  const [ano, setAno] = useState<string>(readStoredBalanceteAno);
  const [mesFiltro, setMesFiltro] = useState<string>(TODOS_OS_MESES);
  const [responsavelFiltro, setResponsavelFiltro] = useState("todos");

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useBalanceteBalanco(ano);
  const { data: usuarios } = useContabilUsuarios();

  const contabil = findDepartmentByName(departments, CONTABIL_DEPARTMENT_NAME);
  const nameById = new Map(
    (usuarios ?? []).map((usuario) => [usuario.id, usuario.full_name])
  );

  const all = (companies ?? []).filter((company) =>
    companyUsesSubmenu(company, contabil?.id, "Balancete/Balanço")
  );

  const responsaveisOf = (company: CompanyWithDepartments): string[] =>
    company.department_links.find((link) => link.department_id === contabil?.id)
      ?.profile_ids ?? [];

  const responsavelOptions = Array.from(
    new Set(all.flatMap((company) => responsaveisOf(company)))
  );

  const scoped =
    responsavelFiltro === "todos"
      ? all
      : all.filter((company) =>
          responsaveisOf(company).includes(responsavelFiltro)
        );

  // Fechamento ENCERRADA conta como ENCERRADA; em branco ou LANÇADO como PENDENTE.
  const recordByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record])
  );
  const fechamentoOf = (companyId: string): string =>
    recordByCompany.get(companyId)?.fechamento ?? "";
  const mesValueOf = (
    companyId: string,
    key: keyof BalanceteBalancoRecord
  ): string => (recordByCompany.get(companyId)?.[key] as string | null) ?? "";

  // Mês selecionado: os cartões passam a valer para ele
  // (OK/LANÇADO = lançadas; em branco = pendentes).
  // Sem mês selecionado, a regra é a do Fechamento (ENCERRADA).
  const mesSelecionado = BALANCETE_MESES.find((mes) => mes.key === mesFiltro);
  const concluidas = mesSelecionado
    ? scoped.filter((company) => {
        const value = mesValueOf(company.id, mesSelecionado.key);
        return value === "OK" || value === "LANÇADO";
      }).length
    : scoped.filter((company) => fechamentoOf(company.id) === "ENCERRADA")
        .length;
  const total = scoped.length;
  const pendentes = total - concluidas;

  const formatPct = (value: number): string =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const percentOf = (value: number): string =>
    total > 0 ? formatPct((value / total) * 100) : "0,00";

  // Gráfico por responsável (quando o filtro está em "todos os responsáveis").
  const semResponsavel = all.filter(
    (company) => responsaveisOf(company).length === 0
  ).length;
  const bars = [
    ...responsavelOptions.map((id) => ({
      nome: nameById.get(id) ?? "—",
      count: all.filter((company) => responsaveisOf(company).includes(id))
        .length,
    })),
    ...(semResponsavel > 0
      ? [{ nome: SEM_RESPONSAVEL, count: semResponsavel }]
      : []),
  ].sort((a, b) => b.count - a.count);

  const CARDS = [
    {
      label: mesSelecionado ? `Lançadas (${mesSelecionado.label})` : "Encerradas",
      value: concluidas,
      className: "bg-status-success text-status-success-foreground",
    },
    {
      label: "Pendentes",
      value: pendentes,
      className: "bg-status-danger text-status-danger-foreground",
    },
    {
      label: "Total de empresas",
      value: total,
      className: "bg-muted text-muted-foreground",
    },
  ];

  const handleAnoChange = (value: string) => {
    setAno(value);
    writeStoredBalanceteAno(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="dash-contabil-ano">Ano</Label>
          <Select value={ano} onValueChange={handleAnoChange}>
            <SelectTrigger id="dash-contabil-ano" className="mt-1.5 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {balanceteAnos().map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dash-contabil-mes">Mês</Label>
          <Select value={mesFiltro} onValueChange={setMesFiltro}>
            <SelectTrigger id="dash-contabil-mes" className="mt-1.5 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_OS_MESES}>Todos os meses</SelectItem>
              {BALANCETE_MESES.map((mes) => (
                <SelectItem key={mes.key} value={mes.key}>
                  {mes.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-64">
          <Label htmlFor="dash-contabil-resp">Responsável</Label>
          <Select
            value={responsavelFiltro}
            onValueChange={setResponsavelFiltro}
          >
            <SelectTrigger id="dash-contabil-resp" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os responsáveis</SelectItem>
              {responsavelOptions.map((id) => (
                <SelectItem key={id} value={id}>
                  {nameById.get(id) ?? "—"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar o dashboard.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CARDS.map((card) => (
              <Card key={card.label}>
                <CardHeader className={cn("rounded-t-lg pb-2", card.className)}>
                  <CardTitle className="text-sm font-semibold">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="text-3xl font-bold tabular-nums">
                    {card.value}
                  </div>
                  <CardDescription className="mt-1">
                    {percentOf(card.value)}% do total
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {responsavelFiltro === "todos" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Empresas por responsável
                </CardTitle>
                <CardDescription>
                  Quantidade de empresas do departamento{" "}
                  {CONTABIL_DEPARTMENT_NAME} por responsável. Empresas com mais
                  de um responsável contam para cada um.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full"
                  style={{ height: Math.max(240, bars.length * 34) }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bars}
                      layout="vertical"
                      margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
                    >
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="nome"
                        fontSize={11}
                        tickLine={false}
                        width={170}
                        interval={0}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Empresas"
                        fill="hsl(var(--chart-orange))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
