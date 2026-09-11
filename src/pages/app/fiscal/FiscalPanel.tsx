import { useState } from "react";
import { PanelHeader } from "@/components/shell/panel-header";
import { ModuleNav } from "@/components/shell/module-nav";
import { MovimentoFiscal } from "./MovimentoFiscal";

/** Recursos (módulos) do Fiscal — novos módulos entram nesta lista. */
const MODULES = [{ key: "movimento-fiscal", label: "Movimento Fiscal" }] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

export default function FiscalPanel() {
  const [active, setActive] = useState<ModuleKey>("movimento-fiscal");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader title="Fiscal" subtitle="Painel do departamento" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <ModuleNav
          modules={MODULES}
          active={active}
          onSelect={setActive}
          ariaLabel="Recursos do Fiscal"
        />

        {active === "movimento-fiscal" && <MovimentoFiscal />}
      </main>
    </div>
  );
}
