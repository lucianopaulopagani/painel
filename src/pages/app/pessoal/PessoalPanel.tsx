import { useState } from "react";
import { PanelHeader } from "@/components/shell/panel-header";
import { ModuleNav } from "@/components/shell/module-nav";
import MovimentoFiscal from "./MovimentoFiscal";

/** Recursos (módulos) do Pessoal — novos módulos entram nesta lista. */
const MODULES = [
  { key: "movimento-fiscal", label: "Movimento Fiscal" },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

export default function PessoalPanel() {
  const [active, setActive] = useState<ModuleKey>("movimento-fiscal");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader title="Depart. Pessoal" subtitle="Painel do departamento" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <ModuleNav
          modules={MODULES}
          active={active}
          onSelect={setActive}
          ariaLabel="Recursos do Pessoal"
        />

        {active === "movimento-fiscal" && <MovimentoFiscal />}
      </main>
    </div>
  );
}
