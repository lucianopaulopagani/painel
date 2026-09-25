import { useEffect } from "react";

/** Define o título da aba do navegador enquanto a página estiver montada. */
export function useDocumentTitle(title: string, fallback = "Hub P4") {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous || fallback;
    };
  }, [title, fallback]);
}
