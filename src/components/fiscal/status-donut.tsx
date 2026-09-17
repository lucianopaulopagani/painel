import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatusDonutProps {
  finalizadas: number;
  pendentes: number;
  title?: string;
  subtitle?: string;
}

const COLORS = {
  finalizadas: "hsl(var(--chart-success))",
  pendentes: "hsl(var(--chart-warning))",
};

function Metric({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: number;
  percent?: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-bold",
          tone === "success" && "text-status-success-foreground",
          tone === "warning" && "text-status-warning-foreground"
        )}
      >
        {value}
      </div>
      {percent && (
        <div className="mt-0.5 text-xs text-muted-foreground">
          {percent} do total
        </div>
      )}
    </div>
  );
}

/** Porcentagem com 2 casas decimais no formato pt-BR (ex.: 12,50%). */
function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0,00%";
  return `${((value / total) * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function StatusDonut({
  finalizadas,
  pendentes,
  title,
  subtitle,
}: StatusDonutProps) {
  const total = finalizadas + pendentes;
  const percent = formatPercent(finalizadas, total);

  const data = [
    { name: "Finalizadas", value: finalizadas, color: COLORS.finalizadas },
    { name: "Pendentes", value: pendentes, color: COLORS.pendentes },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title ?? "Situação das empresas"}
        </CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3">
          <div className="h-44">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sem empresas.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <Metric label="Total" value={total} />
            <Metric
              label="Finalizadas"
              value={finalizadas}
              percent={formatPercent(finalizadas, total)}
              tone="success"
            />
            <Metric
              label="Pendentes"
              value={pendentes}
              percent={formatPercent(pendentes, total)}
              tone="warning"
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {percent} finalizadas · OK e OK-SM contam como finalizadas; as demais
          como pendentes.
        </p>
      </CardContent>
    </Card>
  );
}
