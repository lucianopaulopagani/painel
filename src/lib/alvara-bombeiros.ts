/** Opções do submenu Alvará dos Bombeiros (Societário). */
export const ALVARA_BOMBEIROS_GERADO_OPTIONS = ["OK"] as const;
export const ALVARA_BOMBEIROS_ENVIADO_OPTIONS = ["OK"] as const;

/** Anos disponíveis no filtro por ano (ano corrente ± 3). */
export function alvaraBombeirosAnos(): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => String(current - 3 + index));
}
