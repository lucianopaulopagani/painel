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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { useMovimentoFiscal } from "@/hooks/use-movimento-fiscal";
import { usePeopleDirectory } from "@/hooks/use-people-directory";
import { FISCAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { isCompanyInactiveInMonth } from "@/lib/companies";
import { isSituacaoFinalizada } from "@/lib/fiscal";
import {
  defaultReferenceMonth,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/fiscal-month";
import { cn } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

const SEM_RESPONSAVEL = "Sem responsável";

/**
 * Dashboard do Movimento Fiscal — mesmo modelo do Societário
 * (cartões com quantidade e porcentagem + gráfico por responsável).
 */
export default function FiscalMovimentoDashboard() {
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || defaultReferenceMonth()
  );
  const [responsavelFiltro, setResponsavelFiltro] = useState("todos");

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useMovimentoFiscal(mes);
  const { data: directory } = usePeopleDirectory();

  const fiscal = findDepartmentByName(departments, FISCAL_DEPARTMENT_NAME);
  const nameById = new Map(
    (directory ?? []).map((user) => [user.id, user.full_name])
  );

  const all = (companies ?? []).filter(
    (company) =>
      company.department_links.some(
        (link) => link.department_id === fiscal?.id
      ) && !isCompanyInactiveInMonth(company, mes)
  );

  const responsaveisOf = (company: CompanyWithDepartments): string[] =>
    company.department_links.find((link) => link.department_id === fiscal?.id)
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

  const situacaoByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record.situacao])
  );

  // OK e OK-SM contam como FINALIZADAS; o restante como PENDENTE.
  const finalizadas = scoped.filter((company) =>
    isSituacaoFinalizada(situacaoByCompany.get(company.id) ?? "")
  ).length;
  const total = scoped.length;
  const pendentes = total - finalizadas;

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
      label: "Finalizadas",
      value: finalizadas,
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

  const handleMonthChange = (value: string) => {
    setMes(value);
    writeStoredMonth(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <Label htmlFor="dash-fiscal-mes">Mês de referência</Label>
          <Input
            id="dash-fiscal-mes"
            type="month"
            value={mes}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div className="w-64">
          <Label htmlFor="dash-fiscal-resp">Responsável</Label>
          <Select
            value={responsavelFiltro}
            onValueChange={setResponsavelFiltro}
          >
            <SelectTrigger id="dash-fiscal-resp" className="mt-1.5">
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
                  {FISCAL_DEPARTMENT_NAME} por responsável. Empresas com mais de
                  um responsável contam para cada um.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bars}
                      margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="nome"
                        fontSize={11}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        allowDecimals={false}
                        fontSize={11}
                        tickLine={false}
                        width={28}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Empresas"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
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
