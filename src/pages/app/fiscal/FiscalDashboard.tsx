import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusDonut } from "@/components/fiscal/status-donut";
import { useFiscalDashboard } from "@/hooks/use-fiscal-dashboard";
import { useAuth } from "@/context/auth";
import { isSituacaoFinalizada } from "@/lib/fiscal";
import {
  defaultReferenceMonth,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/fiscal-month";

export default function FiscalDashboard() {
  const { profile } = useAuth();
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || defaultReferenceMonth()
  );

  const { data, isLoading, isError } = useFiscalDashboard(mes);

  const isAdmin = profile?.role === "admin";
  const rows = (data ?? []).filter((row) =>
    isAdmin ? true : profile ? row.responsavel_ids.includes(profile.id) : false
  );

  const finalizadas = rows.filter((row) =>
    isSituacaoFinalizada(row.situacao)
  ).length;
  const pendentes = rows.length - finalizadas;

  const handleMonthChange = (value: string) => {
    setMes(value);
    writeStoredMonth(value);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Situação das empresas sob sua responsabilidade no mês de referência.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="dashboard-mes">Mês de referência</Label>
        <Input
          id="dashboard-mes"
          type="month"
          value={mes}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="mt-1.5"
        />
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
        <StatusDonut
          finalizadas={finalizadas}
          pendentes={pendentes}
          title="Minhas empresas"
          subtitle={
            isAdmin
              ? "Você é administrador: considera todas as empresas do Fiscal."
              : "Considera apenas as empresas em que você é o responsável."
          }
        />
      )}
    </div>
  );
}
