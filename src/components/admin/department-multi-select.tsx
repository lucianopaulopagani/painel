import { Checkbox } from "@/components/ui/checkbox";
import { useDepartments } from "@/hooks/use-departments";
import { cn } from "@/lib/utils";

interface DepartmentMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function DepartmentMultiSelect({
  value,
  onChange,
  disabled,
  className,
}: DepartmentMultiSelectProps) {
  const { data: departments, isLoading } = useDepartments();

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id]
    );
  };

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Carregando departamentos...
      </p>
    );
  }

  if (!departments || departments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum departamento cadastrado.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "max-h-48 space-y-0.5 overflow-y-auto rounded-md border p-1.5",
        className
      )}
    >
      {departments.map((department) => (
        <label
          key={department.id}
          className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-muted"
        >
          <Checkbox
            checked={value.includes(department.id)}
            onCheckedChange={() => toggle(department.id)}
            disabled={disabled}
          />
          <span>{department.name}</span>
        </label>
      ))}
    </div>
  );
}
