export interface ThemeOption {
  key: string;
  label: string;
  mode: "light" | "dark";
  /** Classe CSS de acento aplicada em <html> (ex.: tema azul/verde/sépia). */
  accent?: string;
}

/** Temas disponíveis para todos os usuários logados. */
export const THEMES: ThemeOption[] = [
  { key: "light", label: "Claro", mode: "light" },
  { key: "dark", label: "Escuro", mode: "dark" },
  { key: "blue", label: "Azul", mode: "light", accent: "theme-blue" },
  { key: "blue-dark", label: "Azul escuro", mode: "dark", accent: "theme-blue" },
  { key: "green", label: "Verde", mode: "light", accent: "theme-green" },
  { key: "sepia", label: "Sépia", mode: "light", accent: "theme-sepia" },
  { key: "contrast", label: "Alto contraste", mode: "light", accent: "theme-contrast" },
];

/** Classes de acento que devem ser removidas ao trocar de tema. */
export const THEME_ACCENT_CLASSES = THEMES.map((theme) => theme.accent).filter(
  (accent): accent is string => Boolean(accent)
);
