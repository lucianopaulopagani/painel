import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
import { useCarneLeao } from "@/hooks/use-carne-leao";
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
  const { data: carneRecords } = useCarneLeao(mes);
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

  // Situação: empresas com tributação Carne Leão usam a tabela do Carne Leão;
  // as demais usam o Movimento Fiscal.
  const situacaoByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record.situacao])
  );
  const carneSituacaoByCompany = new Map(
    (carneRecords ?? []).map((record) => [record.company_id, record.situacao])
  );
  const situacaoOf = (companyId: string): string =>
    carneSituacaoByCompany.get(companyId) ??
    situacaoByCompany.get(companyId) ??
    "";

  // OK e OK-SM contam como FINALIZADAS; o restante como PENDENTE.
  const finalizadas = scoped.filter((company) =>
    isSituacaoFinalizada(situacaoOf(company.id))
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

  // Responsável × tributação: quantidade de empresas por tributação.
  const tributacoes = Array.from(
    new Set(
      all
        .map((company) => company.tributacao)
        .filter((tributacao): tributacao is string => Boolean(tributacao))
    )
  ).sort();

  const responsavelGroups = [
    ...responsavelOptions.map((id) => ({
      nome: nameById.get(id) ?? "—",
      companies: all.filter((company) => responsaveisOf(company).includes(id)),
    })),
    ...(semResponsavel > 0
      ? [
          {
            nome: SEM_RESPONSAVEL,
            companies: all.filter(
              (company) => responsaveisOf(company).length === 0
            ),
          },
        ]
      : []),
  ];

  const stackData = responsavelGroups
    .map((group) => {
      const entry: Record<string, string | number> = {
        nome: group.nome,
        total: group.companies.length,
      };
      for (const tributacao of tributacoes) {
        entry[tributacao] = group.companies.filter(
          (company) => company.tributacao === tributacao
        ).length;
      }
      return entry;
    })
    .sort((a, b) => (b.total as number) - (a.total as number));

  /** Tons de laranja para as tributações empilhadas. */
  const orangeShade = (index: number): string =>
    `hsl(25 95% ${32 + index * 9}%)`;

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
            <>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Empresas por responsável e tributação
                </CardTitle>
                <CardDescription>
                  Quantidade de empresas de cada responsável, separada por
                  tributação (empresas com mais de um responsável contam para
                  cada um).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full"
                  style={{ height: Math.max(240, stackData.length * 34) }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stackData}
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
                      <Legend />
                      {tributacoes.map((tributacao, index) => (
                        <Bar
                          key={tributacao}
                          dataKey={tributacao}
                          stackId="tributacao"
                          name={tributacao}
                          fill={orangeShade(index)}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
