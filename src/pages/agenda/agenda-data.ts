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

export const AGENDA_CALENDARS: AgendaCalendar[] = [
  {
    id: "cal-fiscal",
    name: "Obrigações Fiscais",
    color: "#1d4ed8",
    ownerName: "Você",
    isPrimary: true,
    access: "owner",
  },
  {
    id: "cal-reunioes",
    name: "Reuniões Internas",
    color: "#0f766e",
    ownerName: "Você",
    access: "owner",
  },
  {
    id: "cal-cliente-construtora",
    name: "Cliente · Construtora Alfa",
    color: "#b45309",
    ownerName: "Equipe P4",
    access: "view_busy",
  },
  {
    id: "cal-diretoria",
    name: "Diretoria",
    color: "#7c3aed",
    ownerName: "Diretoria P4",
    access: "view_details",
  },
];

function iso(daysFromToday: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const AGENDA_EVENTS: AgendaEvent[] = [
  {
    id: "ev-1",
    calendarId: "cal-fiscal",
    title: "Entrega DCTFWeb — competência anterior",
    description: "Conferir guias e transmitir antes das 18h.",
    location: "Interno",
    start: iso(0, 9),
    end: iso(0, 10, 30),
    color: "#1d4ed8",
    guests: [{ email: "fiscal@p4contabilidade.app", status: "accepted" }],
  },
  {
    id: "ev-2",
    calendarId: "cal-reunioes",
    title: "Alinhamento semanal da equipe",
    description: "Pauta: carteira, prazos e pendências.",
    location: "Sala de reuniões",
    start: iso(0, 14),
    end: iso(0, 15),
    color: "#0f766e",
  },
  {
    id: "ev-3",
    calendarId: "cal-cliente-construtora",
    title: "Ocupado",
    start: iso(1, 10),
    end: iso(1, 11),
    color: "#b45309",
  },
  {
    id: "ev-4",
    calendarId: "cal-fiscal",
    title: "EFD-Contribuições — Grupo Silva",
    location: "Interno",
    start: iso(1, 15),
    end: iso(1, 16, 30),
    color: "#1d4ed8",
  },
  {
    id: "ev-5",
    calendarId: "cal-diretoria",
    title: "Reunião de diretoria",
    description: "Resultados do trimestre.",
    location: "Sala 2",
    start: iso(2, 8, 30),
    end: iso(2, 10),
    color: "#7c3aed",
  },
  {
    id: "ev-6",
    calendarId: "cal-fiscal",
    title: "DAS — Simples Nacional",
    start: iso(3, 9),
    end: iso(3, 10),
    color: "#1d4ed8",
  },
  {
    id: "ev-7",
    calendarId: "cal-reunioes",
    title: "Onboarding novo cliente",
    location: "Online",
    start: iso(4, 11),
    end: iso(4, 12),
    color: "#0f766e",
  },
  {
    id: "ev-8",
    calendarId: "cal-cliente-construtora",
    title: "Ocupado",
    start: iso(5, 13),
    end: iso(5, 14),
    color: "#b45309",
  },
  {
    id: "ev-9",
    calendarId: "cal-fiscal",
    title: "Fechamento folha de pagamento",
    location: "Interno",
    start: iso(6, 16),
    end: iso(6, 17, 30),
    color: "#1d4ed8",
  },
  {
    id: "ev-10",
    calendarId: "cal-diretoria",
    title: "Planejamento tributário",
    location: "Online",
    start: iso(7, 9),
    end: iso(7, 10, 30),
    color: "#7c3aed",
  },
];

export const PENDING_SHARES: ShareRequest[] = [
  {
    id: "sh-1",
    calendarName: "Agenda · Diretoria P4",
    fromName: "Marina P4",
    fromEmail: "marina@p4contabilidade.app",
    level: "view_details",
    status: "pending",
  },
  {
    id: "sh-2",
    calendarName: "Cliente · Mercado Bom Preço",
    fromName: "Rafael P4",
    fromEmail: "rafael@p4contabilidade.app",
    level: "edit_events",
    status: "pending",
  },
];

export const AGENDA_TEAM = [
  { email: "fiscal@p4contabilidade.app", name: "Fiscal P4" },
  { email: "pessoal@p4contabilidade.app", name: "Pessoal P4" },
  { email: "societario@p4contabilidade.app", name: "Societário P4" },
  { email: "cliente@construtora-alfa.com.br", name: "Construtora Alfa" },
  { email: "diretor@mercado-bompreco.com.br", name: "Mercado Bom Preço" },
];

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
