import { Fragment } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import { formatDayMonth, type Task, type TaskStatus } from "./tarefas-data";

interface WeekColumnProps {
  label: string;
  date: Date;
  isToday: boolean;
  tasks: Task[];
  draggingId: string | null;
  /** Índice onde a tarefa será solta nesta coluna (null quando não é o alvo). */
  dropIndex: number | null;
  onAddTask: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onDragOverIndex: (index: number) => void;
  onDragLeaveColumn: () => void;
  onDrop: () => void;
  /** Coluna larga (visão por dia). */
  wide?: boolean;
}

/** Coluna de um dia (estilo Kanban) — usada nas visões por semana e por dia. */
export function WeekColumn({
  label,
  date,
  isToday,
  tasks,
  draggingId,
  dropIndex,
  onAddTask,
  onStatusChange,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOverIndex,
  onDragLeaveColumn,
  onDrop,
  wide = false,
}: WeekColumnProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border bg-card/70 shadow-sm transition-colors",
        wide ? "min-h-[420px]" : "min-h-[280px]",
        isToday && "border-primary/50",
        dropIndex !== null && "bg-accent/40"
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate text-sm font-semibold">{label}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {formatDayMonth(date)}
          </span>
          {isToday && (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              Hoje
            </Badge>
          )}
        </div>
        <Badge
          variant="secondary"
          className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] tabular-nums"
        >
          {tasks.length}
        </Badge>
      </header>

      <div
        className="flex flex-1 flex-col gap-2 p-2"
        onDragOver={(event) => {
          event.preventDefault();
          onDragOverIndex(tasks.length);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            onDragLeaveColumn();
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          onDrop();
        }}
      >
        {tasks.map((task, index) => (
          <Fragment key={task.id}>
            {dropIndex === index && <DropLine />}
            <TaskCard
              task={task}
              dragging={draggingId === task.id}
              onStatusChange={(status) => onStatusChange(task.id, status)}
              onEdit={() => onEdit(task.id)}
              onDelete={() => onDelete(task.id)}
              onDragStart={() => onDragStart(task.id)}
              onDragEnd={onDragEnd}
              onDragOver={(position) =>
                onDragOverIndex(position === "before" ? index : index + 1)
              }
              onDrop={onDrop}
            />
          </Fragment>
        ))}

        {dropIndex === tasks.length && <DropLine />}

        {tasks.length === 0 && dropIndex === null && (
          <p className="rounded-md border border-dashed px-2 py-6 text-center text-[11px] text-muted-foreground">
            Sem tarefas
          </p>
        )}
      </div>

      <div className="p-2 pt-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddTask}
          className="w-full justify-start gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova tarefa
        </Button>
      </div>
    </section>
  );
}

/** Linha indicadora do ponto de soltura. */
function DropLine() {
  return <div className="h-0.5 shrink-0 rounded-full bg-primary" />;
}
