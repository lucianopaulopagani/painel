import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Dashboards</h2>
        <p className="text-sm text-muted-foreground">
          Área central dos dashboards do projeto. Os painéis criados ao longo do
          desenvolvimento serão exibidos aqui.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Novo dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
