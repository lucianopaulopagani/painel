import { cn } from "@/lib/utils";
import {
  addDays,
  eventsOfDay,
  formatTime,
  isSameDay,
  monthMatrix,
  startOfWeek,
  WEEKDAYS,
  type AgendaEvent,
} from "./agenda-data";

interface ViewProps {
  date: Date;
  events: AgendaEvent[];
  onSelectDay: (day: Date) => void;
  onSelectEvent: (event: AgendaEvent) => void;
}

/** Texto exibido: agendas "view_busy" mostram apenas "Ocupado". */
function eventLabel(event: AgendaEvent): string {
  return event.title;
}

function EventChip({
  event,
  onSelect,
  compact = false,
}: {
  event: AgendaEvent;
  onSelect: (event: AgendaEvent) => void;
  compact?: boolean;
}) {
  const busy = event.title === "Ocupado";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(event);
      }}
      className={cn(
        "flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white transition-opacity hover:opacity-90",
        busy && "italic opacity-80"
      )}
      style={{ backgroundColor: event.color }}
      title={busy ? "Ocupado" : `${formatTime(event.start)} ${eventLabel(event)}`}
    >
      {!compact && <span className="truncate">{formatTime(event.start)}</span>}
      <span className="truncate">{eventLabel(event)}</span>
    </button>
  );
}

export function MonthView({ date, events, onSelectDay, onSelectEvent }: ViewProps) {
  const days = monthMatrix(date);
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsOfDay(events, day);
          const isCurrentMonth = day.getMonth() === date.getMonth();
          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-24 cursor-pointer border-b border-r p-1 align-top last:border-r-0",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  isSameDay(day, today) && "bg-primary text-primary-foreground"
                )}
              >
                {day.getDate()}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    onSelect={onSelectEvent}
                    compact
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="px-1 text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const HOURS = Array.from({ length: 15 }, (_, index) => index + 7); // 07h às 21h

export function WeekView({ date, events, onSelectDay, onSelectEvent }: ViewProps) {
  const weekStart = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const today = new Date();

  return (
    <div className="overflow-auto rounded-lg border">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b bg-muted/50">
          <div />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="border-l px-2 py-1.5 text-center"
            >
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {WEEKDAYS[day.getDay()]}
              </div>
              <div
                className={cn(
                  "mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  isSameDay(day, today) && "bg-primary text-primary-foreground"
                )}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[64px_repeat(7,1fr)] border-b last:border-b-0"
          >
            <div className="px-2 py-1 text-right text-[10px] text-muted-foreground">
              {String(hour).padStart(2, "0")}:00
            </div>
            {days.map((day) => {
              const slotEvents = eventsOfDay(events, day).filter(
                (event) => new Date(event.start).getHours() === hour
              );
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  onClick={() => {
                    const target = new Date(day);
                    target.setHours(hour, 0, 0, 0);
                    onSelectDay(target);
                  }}
                  className="min-h-10 cursor-pointer border-l p-0.5 hover:bg-muted/40"
                >
                  {slotEvents.map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      onSelect={onSelectEvent}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DayView({ date, events, onSelectDay, onSelectEvent }: ViewProps) {
  const dayEvents = eventsOfDay(events, date);

  return (
    <div className="overflow-auto rounded-lg border">
      <div className="grid grid-cols-[64px_1fr]">
        {HOURS.map((hour) => {
          const slotEvents = dayEvents.filter(
            (event) => new Date(event.start).getHours() === hour
          );
          return (
            <div key={hour} className="contents">
              <div className="border-b border-r px-2 py-2 text-right text-[10px] text-muted-foreground">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div
                onClick={() => {
                  const target = new Date(date);
                  target.setHours(hour, 0, 0, 0);
                  onSelectDay(target);
                }}
                className="min-h-14 cursor-pointer border-b p-1 hover:bg-muted/40"
              >
                {slotEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(event);
                    }}
                    className="mb-1 flex w-full flex-col rounded-md px-2 py-1 text-left text-white"
                    style={{ backgroundColor: event.color }}
                  >
                    <span className="text-xs font-semibold">
                      {eventLabel(event)}
                    </span>
                    <span className="text-[10px] opacity-90">
                      {formatTime(event.start)} — {formatTime(event.end)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
