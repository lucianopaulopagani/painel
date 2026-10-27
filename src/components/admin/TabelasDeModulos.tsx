import { useState } from "react";
import { ChevronDown, LayoutList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CadastroTabelaEditor } from "@/components/admin/CadastroTabelaEditor";
import { tabelasDeModulos } from "@/lib/cadastro-tabelas";
import { cn } from "@/lib/utils";

interface TabelasDeModulosProps {
  departamento: string;
  /** Subdepartamentos (módulos) do departamento, na ordem de exibição. */
  submenus: string[];
}

/**
 * Tabelas dos módulos (subdepartamentos) do departamento — cada módulo tem uma
 * tabela e as suas colunas ficam disponíveis para renomear.
 */
export function TabelasDeModulos({
  departamento,
  submenus,
}: TabelasDeModulosProps) {
  const tabelas = tabelasDeModulos(departamento, submenus);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (tabelas.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Este departamento ainda não tem módulos (subdepartamentos)
          cadastrados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <LayoutList className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Tabelas dos módulos</h3>
      </div>

      <div className="divide-y rounded-xl border bg-card shadow-sm">
        {tabelas.map((tabela) => (
          <div key={tabela.nome} className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {tabela.nome}
                </span>
                <Badge variant="secondary" className="tabular-nums">
                  {tabela.colunas.length} coluna
                  {tabela.colunas.length === 1 ? "" : "s"}
                </Badge>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={
                  expanded[tabela.nome]
                    ? "Ocultar colunas"
                    : "Ver/editar as colunas da tabela"
                }
                aria-expanded={expanded[tabela.nome] === true}
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [tabela.nome]: !prev[tabela.nome],
                  }))
                }
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expanded[tabela.nome] && "rotate-180"
                  )}
                />
              </Button>
            </div>

            {expanded[tabela.nome] && (
              <CadastroTabelaEditor
                departamento={departamento}
                tabela={tabela}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        O nome de uma coluna vale para todas as tabelas do departamento que usam
        a mesma coluna.
      </p>
    </div>
  );
}
