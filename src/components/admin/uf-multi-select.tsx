import { CheckboxList } from "@/components/admin/checkbox-list";
import { UFS } from "@/lib/ufs";

interface UfMultiSelectProps {
  value: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function UfMultiSelect({
  value,
  onChange,
  disabled,
  className,
}: UfMultiSelectProps) {
  return (
    <CheckboxList
      options={UFS}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      columns={3}
    />
  );
}
