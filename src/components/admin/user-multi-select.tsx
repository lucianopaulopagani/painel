import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUsers } from "@/hooks/use-users";

interface UserMultiSelectProps {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/** Menu suspenso de múltipla escolha com os usuários cadastrados. */
export function UserMultiSelect({
  value,
  onChange,
  disabled,
  placeholder = "Selecionar responsáveis",
  className,
}: UserMultiSelectProps) {
  const { data: users } = useUsers();
  const [open, setOpen] = useState(false);

  const userList = users ?? [];
  const selectedNames = userList
    .filter((user) => value.includes(user.id))
    .map((user) => user.full_name);

  const toggle = (id: string) => {
    onChange(
      value.includes(id)
        ? value.filter((item) => item !== id)
        : [...value, id]
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
            {selectedNames.length === 0
              ? placeholder
              : selectedNames.join(", ")}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5">
        <div className="max-h-56 overflow-y-auto">
          {userList.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">
              Nenhum usuário cadastrado.
            </p>
          ) : (
            userList.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={value.includes(user.id)}
                  onCheckedChange={() => toggle(user.id)}
                />
                <span className="truncate">{user.full_name}</span>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
