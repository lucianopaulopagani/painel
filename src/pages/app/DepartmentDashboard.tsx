import { Construction } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DepartmentDashboardProps {
  title: string;
}

/** Área de um departamento/subdepartamento ainda em desenvolvimento. */
export function DepartmentDashboard({ title }: DepartmentDashboardProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Esta área será desenvolvida futuramente.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-muted-foreground" />
            Em desenvolvimento
          </CardTitle>
          <CardDescription>
            A área {title} será criada futuramente.
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
