/**
 * Controle de Tarefas Semanal — modelo de dados, status e persistência local.
 * As tarefas ficam no LocalStorage do navegador (nada é enviado ao servidor).
 */

export const TASK_STORAGE_KEY = "p4:tarefas-semana";

export type TaskStatus = "cadastrada" | "iniciada" | "andamento" | "concluida";

export interface Task {
  id: string;
  title: string;
  description: string;
  /** 0 = segunda-feira … 6 = domingo. */
  day: number;
  status: TaskStatus;
  createdAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  day: number;
}

export const WEEKDAYS = [
  { key: 0, label: "Segunda", short: "Seg" },
  { key: 1, label: "Terça", short: "Ter" },
  { key: 2, label: "Quarta", short: "Qua" },
  { key: 3, label: "Quinta", short: "Qui" },
  { key: 4, label: "Sexta", short: "Sex" },
  { key: 5, label: "Sábado", short: "Sáb" },
  { key: 6, label: "Domingo", short: "Dom" },
] as const;

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "cadastrada",
  "iniciada",
  "andamento",
  "concluida",
];

/** Rótulo e cores de cada status (cores do design system, claras e legíveis). */
export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; card: string; dot: string }
> = {
  cadastrada: {
    label: "Cadastrada",
    card: "bg-status-neutral text-status-neutral-foreground",
    dot: "bg-status-neutral-foreground/70",
  },
  iniciada: {
    label: "Iniciada",
    card: "bg-status-warning text-status-warning-foreground",
    dot: "bg-status-warning-foreground/70",
  },
  andamento: {
    label: "Em andamento",
    card: "bg-status-info text-status-info-foreground",
    dot: "bg-status-info-foreground/70",
  },
  concluida: {
    label: "Concluída",
    card: "bg-status-success text-status-success-foreground",
    dot: "bg-status-success-foreground/70",
  },
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUS_ORDER as string[]).includes(value)
  );
}

/** Segunda-feira da semana da data informada. */
export function startOfWeek(date: Date = new Date()): Date {
  const result = new Date(date);
  const offset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - offset);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** As sete datas da semana (segunda a domingo). */
export function weekDates(date: Date = new Date()): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function formatDayMonth(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatWeekRange(dates: Date[]): string {
  if (dates.length === 0) return "";
  const first = dates[0];
  const last = dates[dates.length - 1];
  const sameMonth = first.getMonth() === last.getMonth();
  const firstLabel = first.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: sameMonth ? undefined : "2-digit",
  });
  const lastLabel = last.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${firstLabel} a ${lastLabel}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function createTask(input: TaskInput): Task {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: input.title.trim(),
    description: input.description.trim(),
    day: Math.min(6, Math.max(0, input.day)),
    status: "cadastrada",
    createdAt: new Date().toISOString(),
  };
}

function toTask(value: unknown): Task | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.title !== "string" || raw.title.trim() === "") return null;
  return {
    id: typeof raw.id === "string" ? raw.id : createTask({ title: "x", description: "", day: 0 }).id,
    title: raw.title,
    description: typeof raw.description === "string" ? raw.description : "",
    day:
      typeof raw.day === "number" && raw.day >= 0 && raw.day <= 6
        ? Math.floor(raw.day)
        : 0,
    status: isTaskStatus(raw.status) ? raw.status : "cadastrada",
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString(),
  };
}

/** Lê as tarefas salvas (lista vazia quando indisponível ou corrompido). */
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(toTask)
      .filter((task): task is Task => task !== null);
  } catch {
    return [];
  }
}

/** Salva as tarefas no LocalStorage. */
export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignora armazenamento indisponível
  }
}

/**
 * Move uma tarefa para o dia/posição indicados, mantendo o array agrupado
 * por dia (a ordem do array é a ordem dentro do dia).
 */
export function moveTask(
  tasks: Task[],
  taskId: string,
  toDay: number,
  toIndex: number | null
): Task[] {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return tasks;

  const rest = tasks.filter((item) => item.id !== taskId);
  const dayTasks = rest.filter((item) => item.day === toDay);
  const index =
    toIndex === null
      ? dayTasks.length
      : Math.max(0, Math.min(toIndex, dayTasks.length));
  const moved: Task = { ...task, day: toDay };
  const nextDayTasks = [
    ...dayTasks.slice(0, index),
    moved,
    ...dayTasks.slice(index),
  ];

  const result: Task[] = [];
  for (let day = 0; day < 7; day += 1) {
    result.push(
      ...(day === toDay
        ? nextDayTasks
        : rest.filter((item) => item.day === day))
    );
  }
  return result;
}
