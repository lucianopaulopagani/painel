import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eraser,
  LayoutGrid,
  ListChecks,
  Loader2,
  Plus,
  Square,
  Rows3,
} from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { cn } from "@/lib/utils";
import { MonthView } from "./MonthView";
import { TaskDialog } from "./TaskDialog";
import { WeekColumn } from "./WeekColumn";
import {
  addDays,
  addMonths,
  createTask,
  dateKey,
  formatFullDate,
  formatMonthYear,
  formatWeekRange,
  formatWeekdayDate,
  isSameDay,
  loadTasks,
  moveTask,
  saveTasks,
  startOfWeek,
  taskDate,
  weekDates,
  weekKey,
  WEEKDAYS,
  type Task,
  type TaskInput,
  type TaskStatus,
} from "./tarefas-data";

interface DropTarget {
  day: number;
  index: number;
}

type ViewMode = "day" | "week" | "month";

const VIEW_OPTIONS: { key: ViewMode; label: string; icon: typeof Square }[] = [
  { key: "day", label: "Dia", icon: Square },
  { key: "week", label: "Semana", icon: Rows3 },
  { key: "month", label: "Mês", icon: LayoutGrid },
];

/** Controle de Tarefas Semanal — visões por dia, semana e mês. */
export default function TarefasPage() {
  useDocumentTitle("Tarefas P4");

  const { profile, loading } = useAuth();
  const ownerId = profile?.id ?? null;

  const [view, setView] = useState<ViewMode>("week");
  const [reference, setReference] = useState(() => new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ownerLoaded, setOwnerLoaded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDay, setDialogDay] = useState(0);
  const [dialogWeek, setDialogWeek] = useState(() => weekKey());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const anchor = startOfWeek(reference).getTime();
  const dates = useMemo(() => weekDates(new Date(anchor)), [anchor]);
  const currentWeek = weekKey(new Date(anchor));
  const today = new Date();

  // Índice do dia de referência dentro da semana exibida (0 = segunda).
  const referenceDayIndex = dates.findIndex((date) =>
    isSameDay(date, reference)
  );

  // Carrega as tarefas do usuário (cada usuário tem o seu próprio quadro).
  useEffect(() => {
    if (!ownerId) return;
    setTasks(loadTasks(ownerId));
    setOwnerLoaded(ownerId);
  }, [ownerId]);

  // Persistência local: as tarefas não somem ao recarregar a página.
  useEffect(() => {
    if (!ownerId || ownerLoaded !== ownerId) return;
    saveTasks(ownerId, tasks);
  }, [tasks, ownerId, ownerLoaded]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = dateKey(taskDate(task));
      const list = map.get(key);
      if (list) list.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <ListChecks className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-lg font-semibold">
            Entre no sistema para usar as tarefas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O quadro de tarefas é individual: cada usuário vê apenas as suas
            tarefas.
          </p>
        </div>
        <Button asChild>
          <Link to="/">Ir para o acesso</Link>
        </Button>
      </div>
    );
  }

  const weekTasks = tasks.filter((task) => task.week === currentWeek);
  const dayTasks =
    referenceDayIndex >= 0
      ? weekTasks.filter((task) => task.day === referenceDayIndex)
      : [];

  const tasksOfDay = (day: number): Task[] =>
    weekTasks.filter((task) => task.day === day);

  const concluidas = weekTasks.filter(
    (task) => task.status === "concluida"
  ).length;

  const openDialog = (day: number, week: string) => {
    setEditingId(null);
    setDialogDay(day);
    setDialogWeek(week);
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setDialogDay(task.day);
    setDialogWeek(task.week);
    setDialogOpen(true);
  };

  const openDialogForDate = (date: Date) => {
    // 0 = segunda-feira … 6 = domingo.
    openDialog((date.getDay() + 6) % 7, weekKey(date));
  };

  const submitTask = (input: TaskInput) => {
    if (editingId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingId ? { ...task, ...input } : task
        )
      );
      setEditingId(null);
      return;
    }
    setTasks((prev) => [...prev, createTask(input)]);
  };

  const changeStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status } : task))
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setTasks((prev) => prev.filter((task) => task.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  const handleDrop = () => {
    if (!draggingId || !dropTarget) {
      setDraggingId(null);
      setDropTarget(null);
      return;
    }
    setTasks((prev) =>
      moveTask(prev, draggingId, dropTarget.day, dropTarget.index)
    );
    setDraggingId(null);
    setDropTarget(null);
  };

  const step = (direction: 1 | -1) => {
    setReference((prev) => {
      if (view === "day") return addDays(prev, direction);
      if (view === "week") return addDays(prev, direction * 7);
      return addMonths(prev, direction);
    });
  };

  const periodLabel =
    view === "day"
      ? formatWeekdayDate(reference)
      : view === "week"
        ? formatWeekRange(dates)
        : formatMonthYear(reference);

  const selectDate = (date: Date) => {
    setReference(date);
    setCalendarOpen(false);
  };

  const goToDay = (date: Date) => {
    setReference(date);
    setView("day");
  };

  const dragOverHandler = (day: number) => (index: number) =>
    setDropTarget({ day, index });

  const endDrag = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const columnBindings = {
    draggingId,
    onStatusChange: changeStatus,
    onEdit: (taskId: string) => {
      const task = tasks.find((item) => item.id === taskId);
      if (task) openEdit(task);
    },
    onDelete: (taskId: string) => {
      const task = tasks.find((item) => item.id === taskId);
      if (task) setPendingDelete(task);
    },
    onDragStart: setDraggingId,
    onDragEnd: endDrag,
    onDragLeaveColumn: () => setDropTarget(null),
    onDrop: handleDrop,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <ListChecks className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate text-sm font-semibold">
              Controle de Tarefas
            </span>
            <Badge variant="secondary" className="hidden lg:inline-flex">
              {periodLabel}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-md border p-0.5">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.key}
                    type="button"
                    variant={view === option.key ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-7 gap-1.5 px-2.5 text-xs",
                      view === option.key && "font-semibold"
                    )}
                    onClick={() => setView(option.key)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center rounded-md border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-r-none px-2"
                title="Anterior"
                onClick={() => step(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-none border-x px-3 text-xs"
                onClick={() => setReference(new Date())}
              >
                Hoje
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-l-none px-2"
                title="Próximo"
                onClick={() => step(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  title="Escolher a data pelo calendário"
                >
                  <CalendarDays className="h-4 w-4" />
                  {formatFullDate(reference)}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={reference}
                  onSelect={(date) => date && selectDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="hidden text-xs text-muted-foreground 2xl:inline">
              {weekTasks.length} tarefa{weekTasks.length === 1 ? "" : "s"} ·{" "}
              {concluidas} concluída{concluidas === 1 ? "" : "s"}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setClearOpen(true)}
              disabled={weekTasks.length === 0}
            >
              <Eraser className="h-4 w-4" />
              Limpar semana
            </Button>

            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => openDialog(0, currentWeek)}
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6">
        <div className="mb-3 flex items-center gap-2 lg:hidden">
          <Badge variant="secondary">{periodLabel}</Badge>
        </div>

        {view === "month" ? (
          <MonthView
            reference={reference}
            today={today}
            tasksByDate={tasksByDate}
            onSelectDay={goToDay}
            onAddTask={openDialogForDate}
          />
        ) : view === "week" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            {WEEKDAYS.map((weekday) => (
              <WeekColumn
                key={weekday.key}
                label={weekday.label}
                date={dates[weekday.key]}
                isToday={isSameDay(dates[weekday.key], today)}
                tasks={tasksOfDay(weekday.key)}
                dropIndex={
                  dropTarget?.day === weekday.key ? dropTarget.index : null
                }
                onAddTask={() => openDialog(weekday.key, currentWeek)}
                {...columnBindings}
                onDragOverIndex={dragOverHandler(weekday.key)}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl">
            <WeekColumn
              wide
              label={formatWeekdayDate(reference)}
              date={reference}
              isToday={isSameDay(reference, today)}
              tasks={dayTasks}
              dropIndex={
                dropTarget?.day === referenceDayIndex ? dropTarget.index : null
              }
              onAddTask={() =>
                openDialog(
                  referenceDayIndex < 0 ? 0 : referenceDayIndex,
                  currentWeek
                )
              }
              {...columnBindings}
              onDragOverIndex={dragOverHandler(
                referenceDayIndex < 0 ? 0 : referenceDayIndex
              )}
            />
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Arraste as tarefas entre os dias para reorganizar a semana. Cada
          usuário tem o seu próprio quadro e as tarefas ficam salvas neste
          navegador, semana por semana.
        </p>
      </main>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDay={dialogDay}
        week={dialogWeek}
        task={editingId ? tasks.find((task) => task.id === editingId) ?? null : null}
        onSubmit={submitTask}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              A tarefa “{pendingDelete?.title}” será excluída. Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar as tarefas desta semana?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão excluídas apenas as tarefas de {formatWeekRange(dates)}. As
              demais semanas continuam intactas. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setTasks((prev) =>
                  prev.filter((task) => task.week !== currentWeek)
                );
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
