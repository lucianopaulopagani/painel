import { createContext, useContext } from "react";
import type { ThemeOption } from "@/lib/themes";

export interface ThemeContextValue {
  theme: ThemeOption;
  themes: ThemeOption[];
  setThemeKey: (key: string) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }
  return context;
}
