import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DEPARTMENT_DASHBOARDS,
  type DashboardKey,
} from "@/lib/dashboards";

interface DashboardAccessSectionProps {
  /** Dashboards liberados para o usuário (chaves). */
  value: string[];
  onChange: (value: DashboardKey[]) => void;
}

/**
 * Permissão por dashboard de departamento: define quais dashboards o usuário
 * pode visualizar no Dashboard geral (o administrador vê todos).
 */
export function DashboardAccessSection({
  value,
  onChange,
}: DashboardAccessSectionProps) {
  const toggle = (key: DashboardKey) => {
    onChange(
      value.includes(key)
        ? (value.filter((item) => item !== key) as DashboardKey[])
        : ([...value, key] as DashboardKey[])
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <Label className="text-sm font-medium">
        Dashboards por departamento
      </Label>
      <p className="text-xs text-muted-foreground">
        Marque quais dashboards de departamento este usuário pode visualizar no
        Dashboard geral. O administrador vê todos.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DEPARTMENT_DASHBOARDS.map((dashboard) => (
          <label
            key={dashboard.key}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              checked={value.includes(dashboard.key)}
              onCheckedChange={() => toggle(dashboard.key)}
            />
            {dashboard.label}
          </label>
        ))}
      </div>
    </div>
  );
}
