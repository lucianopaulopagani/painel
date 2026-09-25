/** Modelos e dados simulados da Agenda P4 (fase visual, antes do banco). */

export type AccessLevel =
  | "view_busy"
  | "view_details"
  | "edit_events"
  | "owner";

export type ShareStatus = "pending" | "accepted";

export type ViewMode = "month" | "week" | "day";

export interface AgendaCalendar {
  id: string;
  name: string;
  color: string;
  ownerName: string;
  isPrimary?: boolean;
  /** Nível de acesso do usuário atual nesta agenda. */
  access: AccessLevel;
}

export interface AgendaEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO
  end: string; // ISO
  isAllDay?: boolean;
  color: string;
  guests?: { email: string; status: "accepted" | "declined" | "tentative" | "pending" }[];
}

export interface ShareRequest {
  id: string;
  calendarName: string;
  fromName: string;
  fromEmail: string;
  level: AccessLevel;
  status: ShareStatus;
}

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  view_busy: "Ver apenas ocupado/disponível",
  view_details: "Ver todos os detalhes dos eventos",
  edit_events: "Fazer alterações em eventos",
  owner: "Gerenciar e compartilhar",
};

export const ACCESS_LEVEL_ORDER: AccessLevel[] = [
  "view_busy",
  "view_details",
  "edit_events",
  "owner",
];

/** O usuário pode editar a agenda/evento? */
export function canEdit(access: AccessLevel): boolean {
  return access === "edit_events" || access === "owner";
}

/** O usuário vê os detalhes (título, descrição, local)? */
export function canViewDetails(access: AccessLevel): boolean {
  return access !== "view_busy";
}

/* ---------------------------- Helpers de data ---------------------------- */

export const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount, 1);
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(date: Date): Date {
  const next = startOfDay(date);
  return addDays(next, -next.getDay());
}

export function monthMatrix(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function formatMonthYear(date: Date): string {
  return `${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

export function formatTime(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export function formatDayLabel(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function eventsOfDay(events: AgendaEvent[], day: Date): AgendaEvent[] {
  return events
    .filter((event) => isSameDay(new Date(event.start), day))
    .sort((a, b) => a.start.localeCompare(b.start));
}
