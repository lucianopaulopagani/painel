import { Construction } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PessoalSubMenuKey } from "./pessoal-modules";

interface MovimentoFiscalProps {
  active: PessoalSubMenuKey;
}

export default function MovimentoFiscal({ active }: MovimentoFiscalProps) {
  if (active !== "empresas-funcionarios") return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Empresas com funcionários</h2>
        <p className="text-sm text-muted-foreground">
          Departamento Pessoal — empresas e funcionários.
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
