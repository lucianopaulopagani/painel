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
import {
  useAlvaraBombeiros,
  useAlvaraBombeirosAll,
} from "@/hooks/use-alvara-bombeiros";
import { useCompanies } from "@/hooks/use-companies";
import { useDepartments } from "@/hooks/use-departments";
import { SOCIETARIO_DEPARTMENT_NAME, findDepartmentByName } from "@/lib/departments";
import { companyUsesSubmenu } from "@/lib/department-submenus";
import { isCompanyInactiveToday } from "@/lib/companies";
import { alvaraBombeirosAnos } from "@/lib/alvara-bombeiros";
import { cn } from "@/lib/utils";

const MESES = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export default function AlvaraBombeirosDashboard() {
  const [ano, setAno] = useState<string>(String(new Date().getFullYear()));
  const [ufFiltro, setUfFiltro] = useState("todos");
  const [municipioFiltro, setMunicipioFiltro] = useState("todos");

  const { data: departments } = useDepartments();
  const { data: companies, isLoading, isError } = useCompanies();
  const { data: records } = useAlvaraBombeiros(ano);
  const { data: allRecords } = useAlvaraBombeirosAll();

  const societario = findDepartmentByName(
    departments,
    SOCIETARIO_DEPARTMENT_NAME
  );

  const allCompanies = (companies ?? []).filter(
    (company) =>
      companyUsesSubmenu(company, societario?.id, "Alvará Bombeiros") &&
      !isCompanyInactiveToday(company)
  );

  const recordByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record])
  );

  /** Vencimento efetivo (herdado dos anos anteriores até ser alterado). */
  const effectiveVencimento = (companyId: string): string | null => {
    const current = recordByCompany.get(companyId);
    if (current && current.vencimento) return current.vencimento;
    const prior = (allRecords ?? [])
      .filter((record) => record.company_id === companyId && record.ano < ano)
      .sort((a, b) => b.ano.localeCompare(a.ano));
    return prior.find((record) => record.vencimento)?.vencimento ?? null;
  };

  // Filtros de UF e município (quando selecionados, restringem o dashboard).
  const scopeCompanies = allCompanies.filter((company) => {
    const matchUf = ufFiltro === "todos" || company.uf === ufFiltro;
    const matchMunicipio =
      municipioFiltro === "todos" || company.municipio === municipioFiltro;
    return matchUf && matchMunicipio;
  });

  const ufOptions = Array.from(
    new Set(
      allCompanies
        .map((company) => company.uf)
        .filter((uf): uf is string => Boolean(uf))
    )
  ).sort();

  const municipioOptions = Array.from(
    new Set(
      allCompanies
        .filter((company) => ufFiltro === "todos" || company.uf === ufFiltro)
        .map((company) => company.municipio)
        .filter((municipio): municipio is string => Boolean(municipio))
    )
  ).sort();

  const total = scopeCompanies.length;
  const gerado = scopeCompanies.filter(
    (company) => recordByCompany.get(company.id)?.gerado === "OK"
  ).length;
  const enviado = scopeCompanies.filter(
    (company) => recordByCompany.get(company.id)?.enviado === "OK"
  ).length;
  const semVencimento = scopeCompanies.filter(
    (company) => !effectiveVencimento(company.id)
  ).length;

  const formatPct = (value: number): string =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const percentOf = (value: number): string =>
    total > 0 ? formatPct((value / total) * 100) : "0,00";

  // Alvarás a vencer nos 12 meses do ano selecionado.
  const months = MESES.map((label, index) => ({
    key: String(index + 1).padStart(2, "0"),
    label: `${label}/${ano.slice(2)}`,
    count: 0,
  }));
  for (const company of scopeCompanies) {
    const vencimento = effectiveVencimento(company.id);
    const match = vencimento ? /^(\d{1,2})\/(\d{1,2})$/.exec(vencimento) : null;
    if (!match) continue;
    const monthPart = match[2].padStart(2, "0");
    const bucket = months.findIndex((entry) => entry.key === monthPart);
    if (bucket >= 0) months[bucket].count += 1;
  }

  const CARDS = [
    {
      label: "Gerado",
      value: gerado,
      className: "bg-status-success text-status-success-foreground",
    },
    {
      label: "Enviado",
      value: enviado,
      className: "bg-status-warning text-status-warning-foreground",
    },
    {
      label: "Total",
      value: total,
      className: "bg-muted text-muted-foreground",
    },
    {
      label: "Sem vencimento",
      value: semVencimento,
      className: "bg-status-danger text-status-danger-foreground",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Alvará Bombeiros — empresas do departamento{" "}
          {SOCIETARIO_DEPARTMENT_NAME}.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="dash-alvara-ano">Ano</Label>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger id="dash-alvara-ano" className="mt-1.5 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {alvaraBombeirosAnos().map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dash-alvara-uf">UF</Label>
          <Select
            value={ufFiltro}
            onValueChange={(value) => {
              setUfFiltro(value);
              setMunicipioFiltro("todos");
            }}
          >
            <SelectTrigger id="dash-alvara-uf" className="mt-1.5 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as UF</SelectItem>
              {ufOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dash-alvara-municipio">Município</Label>
          <Select value={municipioFiltro} onValueChange={setMunicipioFiltro}>
            <SelectTrigger id="dash-alvara-municipio" className="mt-1.5 w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="todos">Todos os municípios</SelectItem>
              {municipioOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Alvarás a vencer nos meses de {ano}
              </CardTitle>
              <CardDescription>
                Quantidade de alvarás com vencimento em cada mês
                {ufFiltro === "todos" ? "" : ` — UF ${ufFiltro}`}
                {municipioFiltro === "todos"
                  ? ""
                  : ` — ${municipioFiltro}`}
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={months}
                    margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} tickLine={false} />
                    <YAxis
                      allowDecimals={false}
                      fontSize={11}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Alvarás"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}