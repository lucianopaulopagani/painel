import { useState } from "react";
import { PanelHeader } from "@/components/shell/panel-header";
import { ModuleNav } from "@/components/shell/module-nav";
import { DepartmentDashboard } from "./DepartmentDashboard";

/** Recursos (módulos) do Contábil — novos módulos entram nesta lista. */
const MODULES = [
  { key: "dashboard", label: "Dashboard" },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

export default function ContabilPanel() {
  const [active, setActive] = useState<ModuleKey>("dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader title="Contábil" subtitle="Painel do departamento" />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6">
        <ModuleNav
          modules={MODULES}
          active={active}
          onSelect={setActive}
          ariaLabel="Recursos do Contábil"
        />

        {active === "dashboard" && <DepartmentDashboard title="Contábil" />}
      </main>
    </div>
  );
}
