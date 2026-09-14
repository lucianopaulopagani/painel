import { useState } from "react";
import { ChevronDown, Construction, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusDonut } from "@/components/fiscal/status-donut";
import {
  ResponsavelBars,
  type ResponsavelBarData,
} from "@/components/fiscal/responsavel-bars";
import { useFiscalDashboard } from "@/hooks/use-fiscal-dashboard";
import { isSituacaoFinalizada } from "@/lib/fiscal";
import { cn } from "@/lib/utils";
import SocietarioDashboard from "./societario/SocietarioDashboard";
import {
  defaultReferenceMonth,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/fiscal-month";

const SEM_RESPONSAVEL = "Sem responsável";

/** Dashboards por departamento — novos dashboards entram nesta lista. */
const DASHBOARDS = [
  { key: "fiscal", label: "Fiscal" },
  { key: "pessoal", label: "Pessoal" },
  { key: "societario", label: "Societário" },
  { key: "contabil", label: "Contábil" },
  { key: "nota-fiscal", label: "Nota Fiscal" },
] as const;

type DashboardKey = (typeof DASHBOARDS)[number]["key"];

export default function GeneralDashboard() {
  const [active, setActive] = useState<DashboardKey>("fiscal");
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

  const activeLabel =
    DASHBOARDS.find((dashboard) => dashboard.key === active)?.label ?? "";

  return (
    <div className="space-y-4">
      <div className="group relative w-fit">
          <Button type="button" variant="outline" className="gap-2">
            {activeLabel}
            <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
          </Button>

          <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            <div className="min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              {DASHBOARDS.map((dashboard) => (
                <button
                  key={dashboard.key}
                  type="button"
                  onClick={() => setActive(dashboard.key)}
                  className={cn(
                    "flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted",
                    active === dashboard.key && "bg-muted font-medium"
                  )}
                >
                  {dashboard.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {active === "fiscal" ? (
          <>
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
                      Finalizadas e pendentes por responsável. Empresas com mais
                      de um responsável contam para cada um.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ResponsavelBars data={responsavelData} />
                  </CardContent>
                </Card>
              </>
            )}
          </>
        ) : active === "societario" ? (
          <SocietarioDashboard />
        ) : (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-muted-foreground" />
                Dashboard {activeLabel}
              </CardTitle>
              <CardDescription>
                O dashboard deste departamento será criado futuramente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Área em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
