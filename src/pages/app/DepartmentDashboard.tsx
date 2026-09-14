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

/** Dashboard de um departamento — substituído pelo conteúdo real futuramente. */
export function DepartmentDashboard({ title }: DepartmentDashboardProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Dashboard do departamento {title}.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-muted-foreground" />
            Dashboard {title}
          </CardTitle>
          <CardDescription>
            O dashboard deste departamento será criado futuramente.
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
