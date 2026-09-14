import { Construction } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DepartmentDashboard } from "../DepartmentDashboard";
import ComplementoInss from "./ComplementoInss";
import Domesticas from "./Domesticas";
import EmpresasFiscal from "./EmpresasFiscal";
import EmpresasFuncionarios from "./EmpresasFuncionarios";
import Ponto from "./Ponto";
import type { PessoalSubMenuKey } from "./pessoal-modules";

interface MovimentoFiscalProps {
  active: PessoalSubMenuKey;
}

const PLACEHOLDERS: Partial<Record<PessoalSubMenuKey, string>> = {
  "empresas-fiscal": "Empresas Fiscal",
  ponto: "Ponto",
};

export default function MovimentoFiscal({ active }: MovimentoFiscalProps) {
  if (active === "dashboard") {
    return <DepartmentDashboard title="Pessoal" />;
  }

  if (active === "ponto") {
    return <Ponto />;
  }

  if (active === "empresas-fiscal") {
    return <EmpresasFiscal />;
  }

  if (active === "empresas-funcionarios") {
    return <EmpresasFuncionarios />;
  }

  if (active === "complemento-inss") {
    return <ComplementoInss />;
  }

  if (active === "domesticas") {
    return <Domesticas />;
  }

  const title = PLACEHOLDERS[active];
  if (!title) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Folha de Pagamento Mensal — departamento Pessoal.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
          <CardDescription>
            Funcionalidades desta área serão implementadas em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Área em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
