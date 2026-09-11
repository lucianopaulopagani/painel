import { useState } from "react";
import { PanelHeader } from "@/components/shell/panel-header";
import { cn } from "@/lib/utils";
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
        <nav
          aria-label="Recursos do Societário"
          className="mb-6 flex gap-1 overflow-x-auto border-b"
        >
          {MODULES.map((module) => (
            <button
              key={module.key}
              type="button"
              onClick={() => setActive(module.key)}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                active === module.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {module.label}
            </button>
          ))}
        </nav>

        {active === "certificado-digital" && <CertificadoDigital />}
      </main>
    </div>
  );
}
