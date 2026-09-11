import { useState } from "react";
import { PanelHeader } from "@/components/shell/panel-header";
import { ModuleNav } from "@/components/shell/module-nav";
import CertificadoDigital from "./CertificadoDigital";

/** Recursos (módulos) do Societário — novos módulos entram nesta lista. */
const MODULES = [
  { key: "certificado-digital", label: "Certificado digital" },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

export default function SocietarioPanel() {
  const [active, setActive] = useState<ModuleKey>("certificado-digital");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PanelHeader title="Societário" subtitle="Painel do departamento" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <ModuleNav
          modules={MODULES}
          active={active}
          onSelect={setActive}
          ariaLabel="Recursos do Societário"
        />

        {active === "certificado-digital" && <CertificadoDigital />}
      </main>
    </div>
  );
}
