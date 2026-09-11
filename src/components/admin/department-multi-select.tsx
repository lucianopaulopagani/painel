import { CheckboxList } from "@/components/admin/checkbox-list";
import { useDepartments } from "@/hooks/use-departments";

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

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Carregando departamentos...
      </p>
    );
  }

  return (
    <CheckboxList
      options={(departments ?? []).map((department) => ({
        value: department.id,
        label: department.name,
      }))}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      emptyMessage="Nenhum departamento cadastrado."
    />
  );
}
