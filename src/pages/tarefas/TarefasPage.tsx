import { useEffect, useMemo, useState } from "react";
import { Eraser, ListChecks, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { TaskDialog } from "./TaskDialog";
import { WeekColumn } from "./WeekColumn";
import {
  createTask,
  formatWeekRange,
  isSameDay,
  loadTasks,
  moveTask,
  saveTasks,
  weekDates,
  WEEKDAYS,
  type Task,
  type TaskInput,
  type TaskStatus,
} from "./tarefas-data";

interface DropTarget {
  day: number;
  index: number;
}

/** Controle de Tarefas Semanal — quadro Kanban de segunda a domingo. */
export default function TarefasPage() {
  useDocumentTitle("Tarefas P4");

  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDay, setDialogDay] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const dates = useMemo(() => weekDates(new Date()), []);
  const today = new Date();

  // Persistência local: as tarefas não somem ao recarregar a página.
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const tasksOfDay = (day: number): Task[] =>
    tasks.filter((task) => task.day === day);

  const concluidas = tasks.filter((task) => task.status === "concluida").length;

  const openDialog = (day: number) => {
    setDialogDay(day);
    setDialogOpen(true);
  };

  const addTask = (input: TaskInput) => {
    setTasks((prev) => [...prev, createTask(input)]);
  };

  const changeStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status } : task))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleDrop = () => {
    if (!draggingId || !dropTarget) {
      setDraggingId(null);
      setDropTarget(null);
      return;
    }
    setTasks((prev) => moveTask(prev, draggingId, dropTarget.day, dropTarget.index));
    setDraggingId(null);
    setDropTarget(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <ListChecks className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate text-sm font-semibold">
              Controle de Tarefas Semanal
            </span>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {formatWeekRange(dates)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {tasks.length} tarefa{tasks.length === 1 ? "" : "s"} ·{" "}
              {concluidas} concluída{concluidas === 1 ? "" : "s"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setClearOpen(true)}
              disabled={tasks.length === 0}
            >
              <Eraser className="h-4 w-4" />
              Limpar semana
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => openDialog(0)}
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          {WEEKDAYS.map((weekday) => (
            <WeekColumn
              key={weekday.key}
              label={weekday.label}
              date={dates[weekday.key]}
              isToday={isSameDay(dates[weekday.key], today)}
              tasks={tasksOfDay(weekday.key)}
              draggingId={draggingId}
              dropIndex={
                dropTarget?.day === weekday.key ? dropTarget.index : null
              }
              onAddTask={() => openDialog(weekday.key)}
              onStatusChange={changeStatus}
              onDelete={deleteTask}
              onDragStart={setDraggingId}
              onDragEnd={() => {
                setDraggingId(null);
                setDropTarget(null);
              }}
              onDragOverIndex={(index) =>
                setDropTarget({ day: weekday.key, index })
              }
              onDragLeaveColumn={() => setDropTarget(null)}
              onDrop={handleDrop}
            />
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Arraste as tarefas entre os dias para reorganizar a semana. As tarefas
          ficam salvas neste navegador.
        </p>
      </main>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDay={dialogDay}
        onSubmit={addTask}
      />

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar a semana?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as tarefas do quadro serão excluídas. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setTasks([]);
                setDropTarget(null);
              }}
            >
              Limpar semana
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
