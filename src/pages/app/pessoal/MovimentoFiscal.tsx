import { Construction } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Ponto from "./Ponto";
import type { PessoalSubMenuKey } from "./pessoal-modules";

interface MovimentoFiscalProps {
  active: PessoalSubMenuKey;
}

const PLACEHOLDERS: Partial<Record<PessoalSubMenuKey, string>> = {
  "empresas-fiscal": "Empresas Fiscal",
  domesticas: "Domésticas",
  ponto: "Ponto",
  "complemento-inss": "Complemento INSS",
};

export default function MovimentoFiscal({ active }: MovimentoFiscalProps) {
  if (active === "ponto") {
    return <Ponto />;
  }

  if (active === "empresas-funcionarios") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Empresas com funcionários
          </h2>
          <p className="text-sm text-muted-foreground">
            Folha de Pagamento Mensal — empresas e funcionários.
          </p>
        </div>

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
      </div>
    );
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
