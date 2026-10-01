/**
 * Controle de Tarefas Semanal — modelo de dados, status e persistência local.
 * As tarefas ficam no LocalStorage do navegador, separadas por usuário e por
 * semana (nada é enviado ao servidor).
 */

const TASK_STORAGE_KEY_PREFIX = "p4:tarefas-semana";
/** Chave usada antes das tarefas serem individuais (migrada uma única vez). */
const LEGACY_TASK_STORAGE_KEY = "p4:tarefas-semana";

export type TaskStatus = "cadastrada" | "iniciada" | "andamento" | "concluida";

export interface Task {
  id: string;
  title: string;
  description: string;
  /** Semana da tarefa: data da segunda-feira no formato AAAA-MM-DD. */
  week: string;
  /** 0 = segunda-feira … 6 = domingo. */
  day: number;
  status: TaskStatus;
  createdAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  day: number;
  week: string;
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

/** Identificador da semana (segunda-feira, AAAA-MM-DD). */
export function weekKey(date: Date = new Date()): string {
  const start = startOfWeek(date);
  const month = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return `${start.getFullYear()}-${month}-${day}`;
}

/** Soma (ou subtrai) dias a uma data, sem alterar a data original. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Soma (ou subtrai) meses a uma data (mantendo o primeiro dia do mês). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months, 1);
  return result;
}

/** Identificador de um dia (AAAA-MM-DD). */
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Data em que a tarefa foi agendada (segunda da semana + dia da semana). */
export function taskDate(task: Task): Date {
  const [year, month, day] = task.week.split("-").map(Number);
  return addDays(new Date(year, (month ?? 1) - 1, day ?? 1), task.day);
}

/** As 6 semanas (42 dias) exibidas no mês da data informada. */
export function monthMatrix(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function formatMonthYear(date: Date): string {
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Ex.: "Segunda, 30/09/2026". */
export function formatWeekdayDate(date: Date): string {
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
  const label = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${label}, ${formatFullDate(date)}`;
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
    week: input.week,
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
    id:
      typeof raw.id === "string"
        ? raw.id
        : createTask({
            title: "x",
            description: "",
            day: 0,
            week: weekKey(),
          }).id,
    title: raw.title,
    description: typeof raw.description === "string" ? raw.description : "",
    week: typeof raw.week === "string" ? raw.week : weekKey(),
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

/** Chave do LocalStorage das tarefas de um usuário. */
export function tasksStorageKey(ownerId: string): string {
  return `${TASK_STORAGE_KEY_PREFIX}:${ownerId}`;
}

function parseTasks(raw: string): Task[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(toTask).filter((task): task is Task => task !== null);
  } catch {
    return [];
  }
}

/** Lê as tarefas salvas do usuário (migrando o formato anterior, se houver). */
export function loadTasks(ownerId: string): Task[] {
  try {
    const raw = localStorage.getItem(tasksStorageKey(ownerId));
    if (raw !== null) return parseTasks(raw);

    const legacy = localStorage.getItem(LEGACY_TASK_STORAGE_KEY);
    if (!legacy) return [];
    const migrated = parseTasks(legacy);
    if (migrated.length > 0) {
      saveTasks(ownerId, migrated);
      localStorage.removeItem(LEGACY_TASK_STORAGE_KEY);
    }
    return migrated;
  } catch {
    return [];
  }
}

/** Salva as tarefas do usuário no LocalStorage. */
export function saveTasks(ownerId: string, tasks: Task[]): void {
  try {
    localStorage.setItem(tasksStorageKey(ownerId), JSON.stringify(tasks));
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
