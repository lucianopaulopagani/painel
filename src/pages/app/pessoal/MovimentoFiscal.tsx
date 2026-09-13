import { useState } from "react";
import { Construction } from "lucide-react";
import { ModuleNav } from "@/components/shell/module-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Submenus do Movimento Fiscal (Pessoal) — novos submenus entram aqui. */
const SUB_MENUS = [
  { key: "empresas-funcionarios", label: "Empresas com funcionários" },
] as const;

type SubMenuKey = (typeof SUB_MENUS)[number]["key"];

export default function MovimentoFiscal() {
  const [active, setActive] = useState<SubMenuKey>("empresas-funcionarios");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Movimento Fiscal</h2>
        <p className="text-sm text-muted-foreground">
          Departamento Pessoal — empresas e funcionários.
        </p>
      </div>

      <ModuleNav
        modules={SUB_MENUS}
        active={active}
        onSelect={setActive}
        ariaLabel="Submenus do Movimento Fiscal"
      />

      {active === "empresas-funcionarios" && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-muted-foreground" />
              Empresas com funcionários
            </CardTitle>
            <CardDescription>
              Esta área está reservada para as empresas com funcionários do
              departamento Pessoal. As funcionalidades serão implementadas em
              breve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aguarde as próximas etapas para a gestão das empresas e seus
              funcionários.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
