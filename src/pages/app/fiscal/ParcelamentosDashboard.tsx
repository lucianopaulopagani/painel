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
import { useDepartments } from "@/hooks/use-departments";
import { useParcelamentos } from "@/hooks/use-parcelamentos";
import { usePeopleDirectory } from "@/hooks/use-people-directory";
import {
  defaultReferenceMonth,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/fiscal-month";
import { FISCAL_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { isCompanyInactiveInMonth } from "@/lib/companies";
import { companyUsesSubmenu, subdepartmentResponsibleIds } from "@/lib/department-submenus";
import {
  PARCELAMENTO_ENVIO_ENVIADO,
  PARCELAMENTO_ENVIO_GERADO,
  isEnvioFinalizado,
} from "@/lib/parcelamentos";
import { cn } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

const SEM_RESPONSAVEL = "Sem responsável";

/** Subdepartamento (Fiscal) que define as empresas do controle. */
const SUBMENU = "Controle de Parcelamentos";

/** Situações do ENVIO consideradas no dashboard (o vazio é "Em branco"). */
const ENVIO_GROUPS = [
  { key: PARCELAMENTO_ENVIO_ENVIADO, label: "Enviado" },
  { key: PARCELAMENTO_ENVIO_GERADO, label: "Gerado" },
  { key: "", label: "Em branco" },
] as const;

/**
 * Dashboard do Controle de Parcelamentos — mesmo formato do dashboard do
 * Movimento Fiscal (cartões com quantidade e porcentagem + gráficos por
 * responsável). A base é a coluna ENVIO: ENVIADO conta como finalizada;
 * GERADO e em branco contam como pendentes.
 */
export default function ParcelamentosDashboard() {
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || defaultReferenceMonth()
  );
  const [responsavelFiltro, setResponsavelFiltro] = useState("todos");

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useParcelamentos(mes);
  const { data: directory } = usePeopleDirectory();

  const fiscal = findDepartmentByName(departments, FISCAL_DEPARTMENT_NAME);
  const nameById = new Map(
    (directory ?? []).map((user) => [user.id, user.full_name])
  );

  const all = (companies ?? []).filter(
    (company) =>
      companyUsesSubmenu(company, fiscal?.id, SUBMENU) &&
      !isCompanyInactiveInMonth(company, mes)
  );

  const responsaveisOf = (company: CompanyWithDepartments): string[] =>
    subdepartmentResponsibleIds(company, fiscal?.id, SUBMENU);

  const responsavelOptions = Array.from(
    new Set(all.flatMap((company) => responsaveisOf(company)))
  );

  const scoped =
    responsavelFiltro === "todos"
      ? all
      : all.filter((company) =>
          responsaveisOf(company).includes(responsavelFiltro)
        );

  const envioByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record.envio ?? ""])
  );
  const envioOf = (companyId: string): string => envioByCompany.get(companyId) ?? "";

  // ENVIADO conta como FINALIZADA; GERADO e em branco como PENDENTE.
  const finalizadas = scoped.filter((company) =>
    isEnvioFinalizado(envioOf(company.id))
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
      for (const envio of ENVIO_GROUPS) {
        entry[envio.label] = group.companies.filter(
          (company) => envioOf(company.id) === envio.key
        ).length;
      }
      return entry;
    })
    .sort((a, b) => (b.total as number) - (a.total as number));

  /** Tons de laranja para as situações empilhadas do ENVIO. */
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
          <Label htmlFor="dash-parcelamentos-mes">Mês de referência</Label>
          <Input
            id="dash-parcelamentos-mes"
            type="month"
            value={mes}
            onChange={(event) => handleMonthChange(event.target.value)}
            className="mt-1.5"
          />
        </div>
        <div className="w-64">
          <Label htmlFor="dash-parcelamentos-resp">Responsável</Label>
          <Select
            value={responsavelFiltro}
            onValueChange={setResponsavelFiltro}
          >
            <SelectTrigger id="dash-parcelamentos-resp" className="mt-1.5">
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
                    Quantidade de empresas com o subdepartamento {SUBMENU} por
                    responsável. Empresas com mais de um responsável contam para
                    cada um.
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
                    Empresas por responsável e ENVIO
                  </CardTitle>
                  <CardDescription>
                    Quantidade de empresas de cada responsável, separada pelo
                    ENVIO do mês (Enviado, Gerado e em branco).
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
                        {ENVIO_GROUPS.map((envio, index) => (
                          <Bar
                            key={envio.label}
                            dataKey={envio.label}
                            stackId="envio"
                            name={envio.label}
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
