import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskStatusSelect } from "./TaskStatusSelect";
import { TASK_STATUS_META, type Task, type TaskStatus } from "./tarefas-data";

interface TaskCardProps {
  task: Task;
  dragging: boolean;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

/** Card de tarefa com seletor rápido de status, edição e exclusão. */
export function TaskCard({
  task,
  dragging,
  onStatusChange,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const meta = TASK_STATUS_META[task.status];
  const concluida = task.status === "concluida";

  return (
    <div
      data-task-card={task.id}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-lg border border-border/60 p-2 shadow-sm transition-all active:cursor-grabbing",
        meta.card,
        dragging && "opacity-40"
      )}
    >
      <div className="flex items-start gap-1">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
        <p
          className={cn(
            "min-w-0 flex-1 break-words text-[13px] font-medium leading-snug",
            concluida && "line-through opacity-75"
          )}
        >
          {task.title}
        </p>
        <button
          type="button"
          onClick={onEdit}
          title="Editar tarefa"
          className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:bg-background/60 hover:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Excluir tarefa"
          className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:bg-background/60 hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {task.description && (
        <p
          className={cn(
            "mt-1 line-clamp-3 pl-4 text-[11px] leading-snug opacity-80",
            concluida && "line-through opacity-60"
          )}
        >
          {task.description}
        </p>
      )}

      <div className="mt-2 pl-4">
        <TaskStatusSelect
          value={task.status}
          onChange={onStatusChange}
          className="w-full"
        />
      </div>
    </div>
  );
}
