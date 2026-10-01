import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskStatusSelect } from "./TaskStatusSelect";
import {
  formatDayMonth,
  isSameDay,
  TASK_STATUS_META,
  type Task,
  type TaskStatus,
} from "./tarefas-data";

export interface ListSection {
  key: string;
  label: string;
  date: Date;
  tasks: Task[];
}

interface ListaViewProps {
  sections: ListSection[];
  today: Date;
  emptyMessage: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onAddTask: (date: Date) => void;
}

/** Visão em lista: um bloco por dia, com as tarefas em linhas. */
export function ListaView({
  sections,
  today,
  emptyMessage,
  onStatusChange,
  onEdit,
  onDelete,
  onAddTask,
}: ListaViewProps) {
  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <section
          key={section.key}
          className="overflow-hidden rounded-xl border bg-card/70"
        >
          <header className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold">
                {section.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatDayMonth(section.date)}
              </span>
              {isSameDay(section.date, today) && (
                <Badge variant="secondary" className="text-[10px]">
                  Hoje
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="h-5 min-w-5 justify-center px-1.5 text-[10px] tabular-nums"
              >
                {section.tasks.length}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onAddTask(section.date)}
              >
                <Plus className="h-3.5 w-3.5" />
                Nova tarefa
              </Button>
            </div>
          </header>

          {section.tasks.length === 0 ? (
            <p className="px-3 py-4 text-center text-[11px] text-muted-foreground">
              Sem tarefas
            </p>
          ) : (
            <ul className="divide-y">
              {section.tasks.map((task) => {
                const concluida = task.status === "concluida";
                return (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 px-3 py-2 transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                        TASK_STATUS_META[task.status].dot
                      )}
                      title={TASK_STATUS_META[task.status].label}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "break-words text-sm font-medium leading-snug",
                          concluida && "line-through opacity-70"
                        )}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p
                          className={cn(
                            "mt-0.5 whitespace-pre-line break-words text-xs text-muted-foreground",
                            concluida && "line-through opacity-70"
                          )}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <TaskStatusSelect
                        value={task.status}
                        onChange={(status) => onStatusChange(task.id, status)}
                        className="w-36"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5"
                        title="Editar tarefa"
                        onClick={() => onEdit(task.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5"
                        title="Excluir tarefa"
                        onClick={() => onDelete(task.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
