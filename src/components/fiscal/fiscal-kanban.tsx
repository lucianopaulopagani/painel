import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isSituacaoFinalizada } from "@/lib/fiscal-month";
import { cn } from "@/lib/utils";

export interface FiscalKanbanItem {
  id: string;
  numero: string | null;
  name: string;
  uf: string | null;
  situacao: string | null;
}

interface FiscalKanbanProps {
  items: FiscalKanbanItem[];
  emptyMessage?: string;
}

const TONE_CLASS = {
  success: {
    column: "border-status-success/50 bg-status-success/10",
    badge:
      "bg-status-success text-status-success-foreground hover:bg-status-success",
  },
  warning: {
    column: "border-status-warning/50 bg-status-warning/10",
    badge:
      "bg-status-warning text-status-warning-foreground hover:bg-status-warning",
  },
} as const;

function Column({
  title,
  items,
  tone,
}: {
  title: string;
  items: FiscalKanbanItem[];
  tone: keyof typeof TONE_CLASS;
}) {
  const Icon = tone === "success" ? CheckCircle2 : Clock;
  return (
    <div className={cn("rounded-lg border p-3", TONE_CLASS[tone].column)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4" />
          {title}
        </span>
        <Badge className={TONE_CLASS[tone].badge}>{items.length}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma empresa.</p>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div
                      className="truncate text-sm font-medium"
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.numero ? `nº ${item.numero}` : "sem número"}
                      {item.uf ? ` · ${item.uf}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold">
                    {item.situacao || "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function FiscalKanban({ items, emptyMessage }: FiscalKanbanProps) {
  if (items.length === 0 && emptyMessage) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const finalizadas = items.filter((item) =>
    isSituacaoFinalizada(item.situacao)
  );
  const pendentes = items.filter(
    (item) => !isSituacaoFinalizada(item.situacao)
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {finalizadas.length} finalizada(s) · {pendentes.length} pendente(s) ·{" "}
        {items.length} no total
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Column title="Finalizadas" items={finalizadas} tone="success" />
        <Column title="Pendentes" items={pendentes} tone="warning" />
      </div>
    </div>
  );
}
