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
import {
  useComplementoInss,
  useComplementoInssAll,
} from "@/hooks/use-complemento-inss";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { usePeopleDirectory } from "@/hooks/use-people-directory";
import {
  COMPLEMENTO_INSS_ENVIO_DESATIVADO,
  COMPLEMENTO_INSS_ENVIO_OPTIONS,
} from "@/lib/complemento-inss";
import { PESSOAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import {
  companyInSubmenuInMonth,
  subdepartmentResponsibleIds,
} from "@/lib/department-submenus";
import {
  defaultReferenceMonth,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/fiscal-month";
import { PESSOAL_ENVIO_CARD_TONE } from "@/lib/pessoal-tones";
import { cn } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

const SEM_RESPONSAVEL = "Sem responsável";

/** Subdepartamento que define as empresas e os responsáveis do módulo. */
const SUBMENU = "Complemento INSS";

/** Situações somadas nos cartões (mesmas opções da coluna Envio). */
const ENVIO_CARDS = COMPLEMENTO_INSS_ENVIO_OPTIONS;

/**
 * Dashboard do Complemento INSS — mesmo formato dos demais subdepartamentos
 * (cartões com quantidade e porcentagem + gráficos por responsável). A base é a
 * coluna Envio do módulo Complemento INSS no mês de referência.
 */
export default function ComplementoInssDashboard() {
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || defaultReferenceMonth()
  );
  const [responsavelFiltro, setResponsavelFiltro] = useState("todos");

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useComplementoInss(mes);
  const { data: allRecords } = useComplementoInssAll();
  const { data: directory } = usePeopleDirectory();

  const pessoal = findDepartmentByName(departments, PESSOAL_DEPARTMENT_NAME);
  const nameById = new Map(
    (directory ?? []).map((user) => [user.id, user.full_name])
  );

  const all = (companies ?? []).filter((company) =>
    companyInSubmenuInMonth(company, pessoal?.id, SUBMENU, mes)
  );

  /** Responsáveis do subdepartamento do módulo. */
  const responsaveisOf = (company: CompanyWithDepartments): string[] =>
    subdepartmentResponsibleIds(company, pessoal?.id, SUBMENU);

  const responsavelOptions = Array.from(
    new Set(all.flatMap((company) => responsaveisOf(company)))
  );

  const scoped =
    responsavelFiltro === "todos"
      ? all
      : all.filter((company) =>
          responsaveisOf(company).includes(responsavelFiltro)
        );

  const recordByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record])
  );

  /**
   * Envio efetivo: usa o registro do mês; se não existir, mantém o valor legado
   * "Desativado" fixo caso o mês anterior mais recente ainda seja Desativado.
   */
  const envioOf = (companyId: string): string => {
    const current = recordByCompany.get(companyId);
    if (current) return current.envio ?? "";
    const prior = (allRecords ?? [])
      .filter(
        (record) =>
          record.company_id === companyId && record.mes_referencia < mes
      )
      .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia));
    return prior[0]?.envio === COMPLEMENTO_INSS_ENVIO_DESATIVADO
      ? COMPLEMENTO_INSS_ENVIO_DESATIVADO
      : "";
  };

  const total = scoped.length;

  const formatPct = (value: number): string =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const percentOf = (value: number): string =>
    total > 0 ? formatPct((value / total) * 100) : "0,00";

  const countEnvio = (envio: string, source = scoped): number =>
    source.filter((company) => envioOf(company.id) === envio).length;

  // O valor antigo "Desativado" só aparece nos cartões/gráficos se ainda existir
  // em algum mês (histórico), como na seção Empresas desativadas da tabela.
  const desativado = countEnvio(COMPLEMENTO_INSS_ENVIO_DESATIVADO);
  const ENVIO_SERIES =
    desativado > 0
      ? [...ENVIO_CARDS, COMPLEMENTO_INSS_ENVIO_DESATIVADO]
      : [...ENVIO_CARDS];

  const CARDS = [
    ...ENVIO_SERIES.map((envio) => ({
      label: envio,
      value: countEnvio(envio),
      className: PESSOAL_ENVIO_CARD_TONE[envio],
    })),
    {
      label: "Total de empresas",
      value: total,
      className: "bg-muted text-muted-foreground",
    },
  ];

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
      for (const envio of ENVIO_SERIES) {
        entry[envio] = countEnvio(envio, group.companies);
      }
      entry["Em branco"] = group.companies.filter(
        (company) => envioOf(company.id) === ""
      ).length;
      return entry;
    })
    .sort((a, b) => (b.total as number) - (a.total as number));

  const STACK_SERIES = [...ENVIO_SERIES, "Em branco"];

  /** Tons de laranja para as situações empilhadas. */
  const orangeShade = (index: number): string =>
    `hsl(25 95% ${32 + index * 9}%)`;

  const handleMonthChange = (value: string) => {
    setMes(value);
    writeStoredMonth(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-52">
          <Label htmlFor="dash-cinss-mes">Mês de referência</Label>
          <Input
            id="dash-cinss-mes"
            type="month"
            value={mes}
            onChange={(event) => handleMonthChange(event.target.value)}
            className="mt-1.5"
          />
        </div>
        <div className="w-64">
          <Label htmlFor="dash-cinss-resp">Responsável</Label>
          <Select
            value={responsavelFiltro}
            onValueChange={setResponsavelFiltro}
          >
            <SelectTrigger id="dash-cinss-resp" className="mt-1.5">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CARDS.map((card) => (
              <Card key={card.label}>
                <CardHeader
                  className={cn("rounded-t-lg pb-2", card.className)}
                >
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
                    Quantidade de empresas do módulo {SUBMENU} por responsável.
                    Empresas com mais de um responsável contam para cada um.
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
                    Empresas por responsável e envio
                  </CardTitle>
                  <CardDescription>
                    Quantidade de empresas de cada responsável, separada pelo
                    envio do mês de referência.
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
                        {STACK_SERIES.map((envio, index) => (
                          <Bar
                            key={envio}
                            dataKey={envio}
                            stackId="envio"
                            name={envio}
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
