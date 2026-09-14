import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PanelHeader } from "@/components/shell/panel-header";
import { StatusDonut } from "@/components/fiscal/status-donut";
import {
  ResponsavelBars,
  type ResponsavelBarData,
} from "@/components/fiscal/responsavel-bars";
import { useFiscalDashboard } from "@/hooks/use-fiscal-dashboard";
import { isSituacaoFinalizada } from "@/lib/fiscal";
import {
  defaultReferenceMonth,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/fiscal-month";

const SEM_RESPONSAVEL = "Sem responsável";

export interface DashboardNavItem {
  key: string;
  label: string;
}

interface GeneralDashboardProps {
  navItems?: DashboardNavItem[];
  onNavigate?: (key: string) => void;
}

export default function GeneralDashboard({
  navItems = [],
  onNavigate,
}: GeneralDashboardProps) {
  const [mes, setMes] = useState<string>(
    () => readStoredMonth() || defaultReferenceMonth()
  );

  const { data, isLoading, isError } = useFiscalDashboard(mes);

  const rows = data ?? [];
  const finalizadas = rows.filter((row) =>
    isSituacaoFinalizada(row.situacao)
  ).length;
  const pendentes = rows.length - finalizadas;

  const byResponsavel = new Map<string, ResponsavelBarData>();
  for (const row of rows) {
    const finalizada = isSituacaoFinalizada(row.situacao);
    const nomes =
      row.responsaveis.length > 0 ? row.responsaveis : [SEM_RESPONSAVEL];
    for (const nome of nomes) {
      const entry =
        byResponsavel.get(nome) ??
        ({ nome, finalizadas: 0, pendentes: 0 } as ResponsavelBarData);
      if (finalizada) entry.finalizadas += 1;
      else entry.pendentes += 1;
      byResponsavel.set(nome, entry);
    }
  }
  const responsavelData = Array.from(byResponsavel.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );

  const handleMonthChange = (value: string) => {
    setMes(value);
    writeStoredMonth(value);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader
        title="Dashboard geral"
        subtitle="Visão geral por departamento"
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-4 py-8 sm:px-6">
        {navItems.length > 0 && onNavigate && (
          <div className="group relative w-fit">
            <Button type="button" variant="outline" className="gap-2">
              Departamentos
              <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </Button>

            <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <div className="min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onNavigate(item.key)}
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-xs">
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
          <>
            <StatusDonut
              finalizadas={finalizadas}
              pendentes={pendentes}
              title="Todas as empresas"
              subtitle="Total geral do departamento Fiscal no mês de referência."
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Por responsável
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Finalizadas e pendentes por responsável. Empresas com mais de
                  um responsável contam para cada um.
                </p>
              </CardHeader>
              <CardContent>
                <ResponsavelBars data={responsavelData} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
