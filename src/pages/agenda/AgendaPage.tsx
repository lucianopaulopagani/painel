import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Plus,
  Settings2,
  Users,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/utils";
import { DayView, MonthView, WeekView } from "./CalendarViews";
import { PendingSharesPanel, ShareDialog } from "./ShareDialog";
import {
  ACCESS_LEVEL_LABELS,
  addDays,
  addMonths,
  canEdit,
  canViewDetails,
  formatDayLabel,
  formatMonthYear,
  formatTime,
  isSameDay,
  monthMatrix,
  startOfWeek,
  WEEKDAYS,
  type AccessLevel,
  type AgendaCalendar,
  type AgendaEvent,
  type ViewMode,
} from "./agenda-data";
import {
  toUiCalendar,
  toUiEvent,
  useAgendaCalendars,
  useAgendaEvents,
  useCreateCalendar,
  useCreateEvent,
  useDeleteEvent,
  useRemoveShare,
  useRespondToShare,
  useShareCalendar,
  useUpdateEvent,
} from "./use-agenda";

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: "day", label: "Dia" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
];

const PRIMARY_COLOR = "#1d4ed8";

/** Mini calendário de navegação mensal. */
function MiniCalendar({
  date,
  onSelect,
  onNavigate,
}: {
  date: Date;
  onSelect: (day: Date) => void;
  onNavigate: (date: Date) => void;
}) {
  const days = monthMatrix(date);
  const today = new Date();

  return (
    <div className="rounded-lg border p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold">{formatMonthYear(date)}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onNavigate(addMonths(date, -1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onNavigate(addMonths(date, 1))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="text-[9px] font-semibold uppercase text-muted-foreground"
          >
            {day.charAt(0)}
          </span>
        ))}
        {days.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelect(day)}
            className={cn(
              "flex h-6 items-center justify-center rounded text-[10px] transition-colors hover:bg-muted",
              day.getMonth() !== date.getMonth() && "text-muted-foreground/50",
              isSameDay(day, today) &&
                "bg-primary font-semibold text-primary-foreground"
            )}
          >
            {day.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

interface EventDraft {
  id?: string;
  calendarId: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  startTime: string;
  endTime: string;
}

export default function AgendaPage() {
  const { profile } = useAuth();
  const myId = profile?.id ?? "";
  const myEmail = (profile?.email ?? "").toLowerCase();

  const [view, setView] = useState<ViewMode>("month");
  const [date, setDate] = useState(new Date());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [reading, setReading] = useState<AgendaEvent | null>(null);
  const [shareCalendarId, setShareCalendarId] = useState<string | null>(null);
  const ensuredRef = useRef(false);

  const { data: calendarRows, isLoading: loadingCalendars } =
    useAgendaCalendars();
  const createCalendar = useCreateCalendar();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const shareCalendar = useShareCalendar();
  const removeShare = useRemoveShare();
  const respondToShare = useRespondToShare();

  const calendars: AgendaCalendar[] = useMemo(
    () => (calendarRows ?? []).map((row) => toUiCalendar(row, myId, myEmail)),
    [calendarRows, myId, myEmail]
  );

  const calendarColorById = useMemo(
    () => new Map(calendars.map((calendar) => [calendar.id, calendar.color])),
    [calendars]
  );

  const { data: eventRows, isLoading: loadingEvents } = useAgendaEvents(
    calendars.map((calendar) => calendar.id)
  );

  const events: AgendaEvent[] = useMemo(
    () =>
      (eventRows ?? []).map((row) =>
        toUiEvent(row, calendarColorById.get(row.calendar_id) ?? PRIMARY_COLOR)
      ),
    [eventRows, calendarColorById]
  );

  // Garante uma agenda principal para o usuário.
  useEffect(() => {
    if (ensuredRef.current || loadingCalendars || !myId) return;
    if (calendars.length === 0) {
      ensuredRef.current = true;
      createCalendar.mutate({
        owner_id: myId,
        name: "Minha agenda",
        color: PRIMARY_COLOR,
      });
    }
  }, [calendars.length, loadingCalendars, myId, createCalendar]);

  const myCalendars = calendars.filter((calendar) => canEdit(calendar.access));
  const sharedCalendars = calendars.filter(
    (calendar) => !canEdit(calendar.access)
  );

  const pendingRequests = useMemo(() => {
    const requests: {
      id: string;
      calendarName: string;
      fromName: string;
      level: AccessLevel;
    }[] = [];
    for (const row of calendarRows ?? []) {
      for (const share of row.calendar_shares ?? []) {
        if (
          share.status === "pending" &&
          share.shared_with_user_email.toLowerCase() === myEmail
        ) {
          requests.push({
            id: share.id,
            calendarName: row.name,
            fromName: "Equipe P4",
            level: share.permission_level,
          });
        }
      }
    }
    return requests;
  }, [calendarRows, myEmail]);

  const shareCalendarItem =
    calendars.find((calendar) => calendar.id === shareCalendarId) ?? null;
  const shareRows =
    (calendarRows ?? []).find((row) => row.id === shareCalendarId)
      ?.calendar_shares ?? [];

  const visibleEvents = events.filter(
    (event) => !hidden.has(event.calendarId)
  );

  const toggleCalendar = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = (day: Date, hour = 9) => {
    if (myCalendars.length === 0) {
      toast.error("Você não tem uma agenda editável.");
      return;
    }
    setDraft({
      calendarId: myCalendars[0].id,
      title: "",
      description: "",
      location: "",
      date: day,
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(hour + 1).padStart(2, "0")}:00`,
    });
  };

  const openEvent = (event: AgendaEvent) => {
    const calendar = calendars.find((item) => item.id === event.calendarId);
    const access: AccessLevel = calendar?.access ?? "view_details";
    if (!canViewDetails(access)) {
      setReading({ ...event, title: "Ocupado" });
      return;
    }
    if (!canEdit(access)) {
      setReading(event);
      return;
    }
    setDraft({
      id: event.id,
      calendarId: event.calendarId,
      title: event.title,
      description: event.description ?? "",
      location: event.location ?? "",
      date: new Date(event.start),
      startTime: formatTime(event.start),
      endTime: formatTime(event.end),
    });
  };

  const handleSave = () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Informe o título do compromisso.");
      return;
    }
    const [startHour, startMinute] = draft.startTime.split(":").map(Number);
    const [endHour, endMinute] = draft.endTime.split(":").map(Number);
    const start = new Date(draft.date);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(draft.date);
    end.setHours(endHour, endMinute, 0, 0);
    const color = calendarColorById.get(draft.calendarId) ?? PRIMARY_COLOR;

    if (draft.id) {
      updateEvent.mutate(
        {
          id: draft.id,
          calendar_id: draft.calendarId,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          location: draft.location.trim() || null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          color,
        },
        {
          onSuccess: () => toast.success("Compromisso atualizado."),
          onError: (error) =>
            toast.error(
              error instanceof Error ? error.message : "Erro ao salvar."
            ),
        }
      );
    } else {
      createEvent.mutate(
        {
          calendar_id: draft.calendarId,
          creator_id: myId,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          location: draft.location.trim() || null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          color,
        },
        {
          onSuccess: () => toast.success("Compromisso criado."),
          onError: (error) =>
            toast.error(
              error instanceof Error ? error.message : "Erro ao salvar."
            ),
        }
      );
    }
    setDraft(null);
  };

  const handleDelete = () => {
    if (!draft?.id) return;
    deleteEvent.mutate(draft.id, {
      onSuccess: () => toast.success("Compromisso excluído."),
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Erro ao excluir."),
    });
    setDraft(null);
  };

  const title =
    view === "month"
      ? formatMonthYear(date)
      : view === "week"
        ? `${formatDayLabel(startOfWeek(date))} — ${formatDayLabel(
            addDays(startOfWeek(date), 6)
          )}`
        : formatDayLabel(date);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Agenda P4</span>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              p4contabilidade.app
            </Badge>
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={() => openCreate(new Date())}
          >
            <Plus className="h-4 w-4" />
            Novo Compromisso
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row">
        {/* Painel lateral */}
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => openCreate(date)}
          >
            <Plus className="h-4 w-4" />
            Novo Compromisso
          </Button>

          <MiniCalendar date={date} onSelect={setDate} onNavigate={setDate} />

          <PendingSharesPanel
            requests={pendingRequests}
            onRespond={(id, accepted) =>
              respondToShare.mutate(
                { id, accepted },
                {
                  onSuccess: () =>
                    toast.success(
                      accepted
                        ? "Compartilhamento aceito — agenda adicionada."
                        : "Compartilhamento recusado."
                    ),
                }
              )
            }
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Minhas agendas
            </span>
            {loadingCalendars ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : myCalendars.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma agenda própria ainda.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {myCalendars.map((calendar) => (
                  <li
                    key={calendar.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted"
                  >
                    <label className="flex min-w-0 cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hidden.has(calendar.id)}
                        onChange={() => toggleCalendar(calendar.id)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <span className="truncate text-sm">{calendar.name}</span>
                    </label>
                    {calendar.access === "owner" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Compartilhamento"
                        onClick={() => setShareCalendarId(calendar.id)}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Agendas compartilhadas
            </span>
            {sharedCalendars.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma agenda compartilhada com você.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {sharedCalendars.map((calendar) => (
                  <li
                    key={calendar.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted"
                  >
                    <label className="flex min-w-0 cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hidden.has(calendar.id)}
                        onChange={() => toggleCalendar(calendar.id)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <span className="truncate text-sm">{calendar.name}</span>
                    </label>
                    {calendar.access === "view_busy" ? (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Lock className="h-3 w-3" />
                        Ocupado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Users className="h-3 w-3" />
                        Detalhes
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Área principal */}
        <main className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDate(new Date())}
              >
                Hoje
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setDate(
                    view === "month"
                      ? addMonths(date, -1)
                      : addDays(date, view === "week" ? -7 : -1)
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setDate(
                    view === "month"
                      ? addMonths(date, 1)
                      : addDays(date, view === "week" ? 7 : 1)
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h1 className="text-base font-semibold">{title}</h1>
            </div>

            <div className="flex items-center gap-1 rounded-md border p-0.5">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setView(option.key)}
                  className={cn(
                    "rounded px-3 py-1 text-sm font-medium transition-colors",
                    view === option.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {loadingEvents || loadingCalendars ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              {view === "month" && (
                <MonthView
                  date={date}
                  events={visibleEvents}
                  onSelectDay={(day) => openCreate(day)}
                  onSelectEvent={openEvent}
                />
              )}
              {view === "week" && (
                <WeekView
                  date={date}
                  events={visibleEvents}
                  onSelectDay={(day) => openCreate(day, day.getHours() || 9)}
                  onSelectEvent={openEvent}
                />
              )}
              {view === "day" && (
                <DayView
                  date={date}
                  events={visibleEvents}
                  onSelectDay={(day) => openCreate(day, day.getHours() || 9)}
                  onSelectEvent={openEvent}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Diálogo de criação/edição */}
      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Editar compromisso" : "Novo compromisso"}
            </DialogTitle>
            <DialogDescription>
              {draft ? formatDayLabel(draft.date) : ""}
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ev-title">Título</Label>
                <Input
                  id="ev-title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Ex.: Entrega DCTFWeb"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Agenda</Label>
                <select
                  value={draft.calendarId}
                  onChange={(e) =>
                    setDraft({ ...draft, calendarId: e.target.value })
                  }
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                  {myCalendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ev-start">Início</Label>
                  <Input
                    id="ev-start"
                    type="time"
                    value={draft.startTime}
                    onChange={(e) =>
                      setDraft({ ...draft, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ev-end">Fim</Label>
                  <Input
                    id="ev-end"
                    type="time"
                    value={draft.endTime}
                    onChange={(e) =>
                      setDraft({ ...draft, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ev-location">Local</Label>
                <Input
                  id="ev-location"
                  value={draft.location}
                  onChange={(e) =>
                    setDraft({ ...draft, location: e.target.value })
                  }
                  placeholder="Sala, online ou interno"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ev-desc">Descrição</Label>
                <Textarea
                  id="ev-desc"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Detalhes do compromisso"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            {draft?.id ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraft(null)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leitura (sem permissão de edição) */}
      <Dialog open={!!reading} onOpenChange={(open) => !open && setReading(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{reading?.title}</DialogTitle>
            <DialogDescription>
              {reading
                ? `${formatTime(reading.start)} — ${formatTime(reading.end)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {reading && (
            <div className="flex flex-col gap-2 text-sm">
              {reading.title === "Ocupado" ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Compromisso ocupado — detalhes não compartilhados.
                </p>
              ) : (
                <>
                  {reading.location && (
                    <p className="text-muted-foreground">
                      Local: {reading.location}
                    </p>
                  )}
                  {reading.description && (
                    <p className="text-muted-foreground">
                      {reading.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Você tem acesso de{" "}
                    {ACCESS_LEVEL_LABELS[
                      calendars.find((c) => c.id === reading.calendarId)
                        ?.access ?? "view_details"
                    ].toLowerCase()}
                    .
                  </p>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ShareDialog
        calendar={shareCalendarItem}
        shares={shareRows}
        open={!!shareCalendarId}
        onOpenChange={(open) => !open && setShareCalendarId(null)}
        onInvite={(email, level) => {
          if (!shareCalendarId) return;
          shareCalendar.mutate(
            {
              calendar_id: shareCalendarId,
              shared_with_user_email: email,
              permission_level: level,
            },
            {
              onSuccess: () =>
                toast.success("Convite enviado — aguarda aceite do usuário."),
              onError: (error) =>
                toast.error(
                  error instanceof Error ? error.message : "Erro ao compartilhar."
                ),
            }
          );
        }}
        onRemove={(id) =>
          removeShare.mutate(id, {
            onSuccess: () => toast.success("Acesso removido."),
          })
        }
      />
    </div>
  );
}
