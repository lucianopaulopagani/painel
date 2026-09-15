import { useEffect, useState, type ReactNode } from "react";
import { THEMES, THEME_ACCENT_CLASSES, type ThemeOption } from "@/lib/themes";
import { ThemeContext } from "@/lib/theme-context";

const STORAGE_KEY = "p4:theme";

function readStoredTheme(): ThemeOption {
  let key: string | null = null;
  try {
    key = localStorage.getItem(STORAGE_KEY);
  } catch {
    // ignora armazenamento indisponível
  }
  return THEMES.find((theme) => theme.key === key) ?? THEMES[0];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeOption>(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme.mode === "dark");
    THEME_ACCENT_CLASSES.forEach((accent) => root.classList.remove(accent));
    if (theme.accent) root.classList.add(theme.accent);
    try {
      localStorage.setItem(STORAGE_KEY, theme.key);
    } catch {
      // ignora armazenamento indisponível
    }
  }, [theme]);

  const setThemeKey = (key: string) => {
    const next = THEMES.find((theme) => theme.key === key);
    if (next) setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, themes: THEMES, setThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
}
