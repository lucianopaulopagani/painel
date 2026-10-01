import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  TASK_STATUS_META,
  TASK_STATUS_ORDER,
  type TaskStatus,
} from "./tarefas-data";

interface TaskStatusSelectProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  className?: string;
}

/** Seletor rápido de status (usado no card do Kanban e na lista). */
export function TaskStatusSelect({
  value,
  onChange,
  className,
}: TaskStatusSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as TaskStatus)}
    >
      <SelectTrigger
        className={cn(
          "h-7 border-border/50 bg-background/70 px-2 text-[11px] font-medium",
          className
        )}
        title="Alterar o status da tarefa"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn("h-2 w-2 shrink-0 rounded-full", TASK_STATUS_META[value].dot)}
          />
          <span className="truncate">
            <SelectValue />
          </span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUS_ORDER.map((status) => (
          <SelectItem key={status} value={status}>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  TASK_STATUS_META[status].dot
                )}
              />
              {TASK_STATUS_META[status].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
