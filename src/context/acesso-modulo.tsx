import { createContext, useContext, type ReactNode } from "react";

import type { PermissaoNivel } from "@/lib/permissoes";

const AcessoModuloContext = createContext<PermissaoNivel>("edit");

/** Nível do usuário no módulo aberto: "edit" ou "view". */
export function AcessoModuloProvider({
  nivel,
  children,
}: {
  nivel: PermissaoNivel;
  children: ReactNode;
}) {
  return (
    <AcessoModuloContext.Provider value={nivel}>
      {children}
    </AcessoModuloContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNivelModulo(): PermissaoNivel {
  return useContext(AcessoModuloContext);
}

/** Verdadeiro quando a permissão do usuário no módulo é somente leitura. */
// eslint-disable-next-line react-refresh/only-export-components
export function useSomenteLeitura(): boolean {
  return useContext(AcessoModuloContext) === "view";
}
