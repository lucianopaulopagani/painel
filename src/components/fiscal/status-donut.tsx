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
  finalizadas: "hsl(var(--status-success))",
  pendentes: "hsl(var(--status-warning))",
};

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
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
    </div>
  );
}

export function StatusDonut({
  finalizadas,
  pendentes,
  title,
  subtitle,
}: StatusDonutProps) {
  const total = finalizadas + pendentes;
  const percent = total > 0 ? Math.round((finalizadas / total) * 100) : 0;

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
            <Metric label="Finalizadas" value={finalizadas} tone="success" />
            <Metric label="Pendentes" value={pendentes} tone="warning" />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {percent}% finalizadas · OK e OK-SM contam como finalizadas; as demais
          como pendentes.
        </p>
      </CardContent>
    </Card>
  );
}
