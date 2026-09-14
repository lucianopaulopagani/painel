import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/shell/panel-header";
import MovimentoFiscal from "./MovimentoFiscal";
import {
  PESSOAL_SUB_MENUS,
  type PessoalSubMenuKey,
} from "./pessoal-modules";
import { cn } from "@/lib/utils";

export default function PessoalPanel() {
  const [active, setActive] =
    useState<PessoalSubMenuKey>("empresas-funcionarios");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader title="Depart. Pessoal" subtitle="Painel do departamento" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="group relative mb-6 w-fit">
          <Button type="button" variant="outline" className="gap-2">
            Folha de Pagamento Mensal
            <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
          </Button>

          <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            <div className="min-w-60 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              {PESSOAL_SUB_MENUS.map((sub) => (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setActive(sub.key)}
                  className={cn(
                    "flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted",
                    active === sub.key && "bg-muted font-medium"
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <MovimentoFiscal active={active} />
      </main>
    </div>
  );
}
