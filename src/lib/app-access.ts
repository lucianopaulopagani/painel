import type { Profile } from "@/lib/types";

/** Aplicativos do hub que podem ser liberados por usuário. */
export type AppAccessKey = "chat" | "tarefas" | "agenda";

export const APP_ACCESS_OPTIONS = [
  {
    key: "chat",
    label: "Chat",
    description: "Chat interno entre os usuários do sistema.",
  },
  {
    key: "tarefas",
    label: "Tarefas",
    description: "Controle de tarefas semanal (Kanban e lista).",
  },
  {
    key: "agenda",
    label: "Agenda",
    description: "Agenda de compromissos e reuniões.",
  },
] as const satisfies readonly {
  key: AppAccessKey;
  label: string;
  description: string;
}[];

/**
 * Indica se o usuário pode acessar o aplicativo. O administrador sempre tem
 * acesso; os demais dependem da liberação feita no cadastro de usuários.
 */
export function hasAppAccess(
  profile: Profile | null | undefined,
  key: AppAccessKey
): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  switch (key) {
    case "chat":
      return profile.chat_access === true;
    case "tarefas":
      return profile.tarefas_access === true;
    case "agenda":
      return profile.agenda_access === true;
  }
}
