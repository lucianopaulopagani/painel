import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  dateKey,
  formatMonthYear,
  isSameDay,
  monthMatrix,
  TASK_STATUS_META,
  TASK_STATUS_ORDER,
  WEEKDAYS,
  type Task,
} from "./tarefas-data";

interface MonthViewProps {
  reference: Date;
  today: Date;
  tasksByDate: Map<string, Task[]>;
  onSelectDay: (date: Date) => void;
  onAddTask: (date: Date) => void;
}

const MAX_CHIPS = 3;

/** Visão mensal: grade do mês com as tarefas de cada dia. */
export function MonthView({
  reference,
  today,
  tasksByDate,
  onSelectDay,
  onAddTask,
}: MonthViewProps) {
  const days = monthMatrix(reference);
  const month = reference.getMonth();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {formatMonthYear(reference)}
          </span>
        </div>
        <div className="hidden flex-wrap items-center gap-3 sm:flex">
          {TASK_STATUS_ORDER.map((status) => (
            <span
              key={status}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  TASK_STATUS_META[status].dot
                )}
              />
              {TASK_STATUS_META[status].label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-7 border-b bg-muted/60">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday.key}
              className="px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground"
            >
              <span className="hidden sm:inline">{weekday.label}</span>
              <span className="sm:hidden">{weekday.short}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dateKey(day);
            const dayTasks = tasksByDate.get(key) ?? [];
            const outside = day.getMonth() !== month;
            const isToday = isSameDay(day, today);
            const hidden = Math.max(0, dayTasks.length - MAX_CHIPS);

            return (
              <div
                key={key}
                className={cn(
                  "group relative flex min-h-[112px] flex-col gap-1 border-b border-r p-1.5 transition-colors",
                  outside ? "bg-muted/30" : "bg-card",
                  isToday && "ring-1 ring-inset ring-primary/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    title="Abrir o dia"
                    className={cn(
                      "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-medium transition-colors hover:bg-muted",
                      outside && "text-muted-foreground/60",
                      isToday &&
                        "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {day.getDate()}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddTask(day)}
                    title="Nova tarefa neste dia"
                    className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {dayTasks.slice(0, MAX_CHIPS).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onSelectDay(day)}
                      title={task.description || task.title}
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-left text-[10px] font-medium",
                        TASK_STATUS_META[task.status].card,
                        task.status === "concluida" &&
                          "line-through opacity-80"
                      )}
                    >
                      {task.title}
                    </button>
                  ))}

                  {hidden > 0 && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{hidden} tarefa{hidden === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
