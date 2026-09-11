import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelHeader } from "@/components/shell/panel-header";
import {
  FiscalKanban,
  type FiscalKanbanItem,
} from "@/components/fiscal/fiscal-kanban";
import { useFiscalDashboard } from "@/hooks/use-fiscal-dashboard";
import {
  defaultReferenceMonth,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/fiscal-month";

export default function GeneralDashboard() {
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || defaultReferenceMonth()
  );

  const { data, isLoading, isError } = useFiscalDashboard(mes);

  const items: FiscalKanbanItem[] = (data ?? []).map((row) => ({
    id: row.company_id,
    numero: row.numero,
    name: row.name,
    uf: row.uf,
    situacao: row.situacao,
  }));

  const handleMonthChange = (value: string) => {
    setMes(value);
    writeStoredMonth(value);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader
        title="Dashboard"
        subtitle="Todas as empresas do departamento Fiscal"
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-4 max-w-xs">
          <Label htmlFor="geral-mes">Mês de referência</Label>
          <Input
            id="geral-mes"
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
          <FiscalKanban
            items={items}
            emptyMessage="Nenhuma empresa vinculada ao departamento Fiscal. Marque esse departamento no cadastro de empresas para que elas apareçam aqui."
          />
        )}
      </main>
    </div>
  );
}
