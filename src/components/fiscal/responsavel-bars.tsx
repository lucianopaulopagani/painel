import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ResponsavelBarData {
  nome: string;
  finalizadas: number;
  pendentes: number;
}

export function ResponsavelBars({ data }: { data: ResponsavelBarData[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sem empresas para exibir.
      </p>
    );
  }

  const height = Math.max(140, data.length * 44);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} fontSize={11} />
          <YAxis
            type="category"
            dataKey="nome"
            width={150}
            fontSize={11}
            tickLine={false}
          />
          <Tooltip />
          <Bar
            dataKey="finalizadas"
            name="Finalizadas"
            stackId="a"
            fill="hsl(var(--status-success))"
          />
          <Bar
            dataKey="pendentes"
            name="Pendentes"
            stackId="a"
            fill="hsl(var(--status-warning))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
