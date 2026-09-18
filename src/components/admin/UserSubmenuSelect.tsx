import { Label } from "@/components/ui/label";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useDepartments } from "@/hooks/use-departments";
import { useAllDepartmentSubmenus } from "@/hooks/use-department-submenus";

interface UserSubmenuSelectProps {
  value: string[];
  onChange: (submenuIds: string[]) => void;
}

/** Seleção dos subdepartamentos (submenus) liberados para o usuário. */
export function UserSubmenuSelect({
  value,
  onChange,
}: UserSubmenuSelectProps) {
  const { data: departments } = useDepartments();
  const { data: allSubmenus } = useAllDepartmentSubmenus();

  const deptNameById = new Map(
    (departments ?? []).map((department) => [department.id, department.name])
  );

  const options = (allSubmenus ?? []).map((submenu) => ({
    value: submenu.id,
    label: `${deptNameById.get(submenu.department_id) ?? ""} › ${submenu.name}`,
  }));

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Subdepartamentos de acesso</Label>
      <MultiSelectDropdown
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Selecionar subdepartamentos"
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">
        O usuário verá apenas estes subdepartamentos (submenus) nos
        departamentos e no Dashboard geral.
      </p>
    </div>
  );
}
