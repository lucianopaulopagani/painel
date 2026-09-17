import { ScrollText, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ManualItem {
  label: string;
  detail: string;
}

export interface ManualSection {
  title: string;
  description: string;
  items: ManualItem[];
}

interface DepartmentManualProps {
  department: string;
  description: string;
  sections: ManualSection[];
  tips?: string[];
}

/** Layout padrão do manual de utilização de um departamento. */
export function DepartmentManual({
  department,
  description,
  sections,
  tips = [],
}: DepartmentManualProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Manual de utilização</h2>
        <p className="text-sm text-muted-foreground">
          Guia de uso do departamento {department}. {description}
        </p>
        <p className="text-xs text-muted-foreground">
          Última atualização: setembro/2026 — este manual acompanha as versões
          desenvolvidas do departamento.
        </p>
      </div>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
              {section.title}
            </CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {section.items.map((item) => (
                <li key={item.label} className="rounded-lg border p-3">
                  <div className="text-sm font-medium">{item.label}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {tips.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Dicas rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {tips.map((tip) => (
                <li key={tip} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
