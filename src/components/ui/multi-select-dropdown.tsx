import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/** Menu suspenso de múltipla escolha genérico. */
export function MultiSelectDropdown({
  options,
  value,
  onChange,
  disabled,
  placeholder = "Selecionar",
  className,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={className ?? "w-full justify-between font-normal"}
        >
          <span className="truncate">
            {selectedLabels.length === 0
              ? placeholder
              : selectedLabels.join(", ")}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5">
        <div className="max-h-56 overflow-y-auto">
          {options.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">
              Nenhuma opção disponível.
            </p>
          ) : (
            options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={() => toggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
