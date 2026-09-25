import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AccessLevel, AgendaCalendar, AgendaEvent } from "./agenda-data";

export interface CalendarShareRow {
  id: string;
  calendar_id: string;
  shared_with_user_email: string;
  permission_level: AccessLevel;
  status: "pending" | "accepted";
}

export interface CalendarRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  color: string;
  timezone: string;
  is_primary: boolean;
  created_at: string;
  calendar_shares?: CalendarShareRow[] | null;
}

export interface EventRow {
  id: string;
  calendar_id: string;
  creator_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  color: string | null;
}

export const agendaKeys = {
  calendars: ["agenda", "calendars"] as const,
  events: (ids: string[]) => ["agenda", "events", ids.slice().sort().join(",")] as const,
};

export function useAgendaCalendars() {
  return useQuery({
    queryKey: agendaKeys.calendars,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendars")
        .select("*, calendar_shares(*)")
        .order("is_primary", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as CalendarRow[];
    },
  });
}

export function useAgendaEvents(calendarIds: string[]) {
  return useQuery({
    queryKey: agendaKeys.events(calendarIds),
    enabled: calendarIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .in("calendar_id", calendarIds)
        .order("start_time");
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      calendar_id: string;
      creator_id: string;
      title: string;
      description: string | null;
      location: string | null;
      start_time: string;
      end_time: string;
      color: string;
    }) => {
      const { error } = await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["agenda", "events"] }),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      title?: string;
      description?: string | null;
      location?: string | null;
      start_time?: string;
      end_time?: string;
      calendar_id?: string;
      color?: string;
    }) => {
      const { error } = await supabase.from("events").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["agenda", "events"] }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["agenda", "events"] }),
  });
}

export function useCreateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      owner_id: string;
      name: string;
      color: string;
    }) => {
      const { error } = await supabase.from("calendars").insert(payload);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: agendaKeys.calendars }),
  });
}

export function useShareCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      calendar_id: string;
      shared_with_user_email: string;
      permission_level: AccessLevel;
    }) => {
      const { error } = await supabase.from("calendar_shares").insert({
        ...payload,
        shared_with_user_email: payload.shared_with_user_email.toLowerCase(),
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: agendaKeys.calendars }),
  });
}

export function useRemoveShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_shares")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: agendaKeys.calendars }),
  });
}

export function useRespondToShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      accepted,
    }: {
      id: string;
      accepted: boolean;
    }) => {
      const { error } = await supabase
        .from("calendar_shares")
        .update({ status: accepted ? "accepted" : "pending" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: agendaKeys.calendars }),
  });
}

/** Converte a linha do banco no modelo da interface, aplicando o nível de acesso. */
export function toUiCalendar(
  row: CalendarRow,
  myId: string,
  myEmail: string
): AgendaCalendar {
  const isOwner = row.owner_id === myId;
  const myShare = (row.calendar_shares ?? []).find(
    (share) =>
      share.status === "accepted" &&
      share.shared_with_user_email.toLowerCase() === myEmail.toLowerCase()
  );
  const access: AccessLevel = isOwner
    ? "owner"
    : (myShare?.permission_level ?? "view_busy");
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    ownerName: isOwner ? "Você" : "Compartilhada",
    isPrimary: row.is_primary,
    access,
  };
}

/** Converte a linha do evento no modelo da interface. */
export function toUiEvent(row: EventRow, calendarColor: string): AgendaEvent {
  return {
    id: row.id,
    calendarId: row.calendar_id,
    title: row.title,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    start: row.start_time,
    end: row.end_time,
    isAllDay: row.is_all_day,
    color: row.color ?? calendarColor,
  };
}
