import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxListProps {
  options: CheckboxOption[];
  value: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  className?: string;
  /** Colunas em telas >= sm. Padrão: 1. */
  columns?: 1 | 2 | 3;
  emptyMessage?: string;
}

const COLUMN_CLASS: Record<1 | 2 | 3, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

export function CheckboxList({
  options,
  value,
  onChange,
  disabled,
  className,
  columns = 1,
  emptyMessage,
}: CheckboxListProps) {
  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyMessage ?? "Nenhuma opção disponível."}
      </p>
    );
  }

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue]
    );
  };

  return (
    <div
      className={cn(
        "max-h-48 overflow-y-auto rounded-md border p-1.5",
        className
      )}
    >
      <div className={cn("grid grid-cols-1 gap-0.5", COLUMN_CLASS[columns])}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-muted"
          >
            <Checkbox
              checked={value.includes(option.value)}
              onCheckedChange={() => toggle(option.value)}
              disabled={disabled}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
