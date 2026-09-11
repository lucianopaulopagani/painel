import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiscalKanban, type FiscalKanbanItem } from "@/components/fiscal/fiscal-kanban";
import { useFiscalCompanies } from "@/hooks/use-fiscal-companies";
import { useMovimentoFiscal } from "@/hooks/use-movimento-fiscal";
import {
  defaultReferenceMonth,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/fiscal-month";

export default function FiscalDashboard() {
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || defaultReferenceMonth()
  );

  const { rows, isLoading, isError } = useFiscalCompanies();
  const { data: records } = useMovimentoFiscal(mes);

  const situacaoByCompany = new Map(
    (records ?? []).map((record) => [record.company_id, record.situacao])
  );

  const items: FiscalKanbanItem[] = rows.map((company) => ({
    id: company.id,
    numero: company.numero,
    name: company.name,
    uf: company.uf,
    situacao: situacaoByCompany.get(company.id) ?? null,
  }));

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
          Não foi possível carregar as empresas.
        </p>
      )}

      {!isLoading && !isError && (
        <FiscalKanban
          items={items}
          emptyMessage="Nenhuma empresa sob sua responsabilidade neste mês."
        />
      )}
    </div>
  );
}
