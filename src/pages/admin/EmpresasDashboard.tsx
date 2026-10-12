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
import { useCompanies } from "@/hooks/use-companies";
import { cn } from "@/lib/utils";
import type { CompanyWithDepartments } from "@/lib/types";

const SEM_UF = "Sem UF";
const SEM_TRIBUTACAO = "Sem tributação";

/** Altura do gráfico conforme a quantidade de barras (padrão dos dashboards). */
const chartHeight = (bars: number): number => Math.max(240, bars * 34);

/** Agrupa as empresas por um valor (UF, tributação etc.), da maior para a menor. */
function countBy(
  companies: CompanyWithDepartments[],
  valueOf: (company: CompanyWithDepartments) => string
): { nome: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const company of companies) {
    const key = valueOf(company) || "—";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts, ([nome, count]) => ({ nome, count })).sort(
    (a, b) => b.count - a.count || a.nome.localeCompare(b.nome, "pt-BR")
  );
}

/**
 * Dashboard de empresas do painel de administração — mesmo formato dos demais
 * dashboards (cartões com quantidade e porcentagem + gráficos de barras
 * horizontais por UF e por tributação).
 */
export default function EmpresasDashboard() {
  const { data: companies, isLoading, isError } = useCompanies();

  const all = companies ?? [];
  const total = all.length;
  const ativas = all.filter((company) => company.ativa).length;
  const inativas = total - ativas;

  const formatPct = (value: number): string =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const percentOf = (value: number): string =>
    total > 0 ? formatPct((value / total) * 100) : "0,00";

  const CARDS = [
    {
      label: "Total de empresas",
      value: total,
      className: "bg-muted text-muted-foreground",
    },
    {
      label: "Ativas",
      value: ativas,
      className: "bg-status-success text-status-success-foreground",
    },
    {
      label: "Inativas",
      value: inativas,
      className: "bg-status-danger text-status-danger-foreground",
    },
  ];

  const ufBars = countBy(all, (company) => company.uf || SEM_UF);
  const tributacaoBars = countBy(
    all,
    (company) => company.tributacao || SEM_TRIBUTACAO
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Dashboard de empresas</h2>
        <p className="text-sm text-muted-foreground">
          Dados das empresas cadastradas: quantidade, ativas e inativas, UF e
          tributação.
        </p>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Empresas por UF</CardTitle>
              <CardDescription>
                Quantidade de empresas cadastradas em cada UF, da maior para a
                menor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full" style={{ height: chartHeight(ufBars.length) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ufBars}
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
                Empresas por tributação
              </CardTitle>
              <CardDescription>
                Quantidade de empresas cadastradas em cada tributação, da maior
                para a menor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="w-full"
                style={{ height: chartHeight(tributacaoBars.length) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tributacaoBars}
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
        </>
      )}
    </div>
  );
}
