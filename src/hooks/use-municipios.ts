import { useQuery } from "@tanstack/react-query";

const cache = new Map<string, string[]>();

/** Busca os municípios do estado na API pública do IBGE (com cache). */
async function fetchMunicipios(uf: string): Promise<string[]> {
  if (!uf || uf.length !== 2) return [];
  const cached = cache.get(uf);
  if (cached) return cached;
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(
        uf
      )}/municipios?orderBy=nome`
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { nome: string }[];
    const names = data
      .map((item) => item.nome)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    cache.set(uf, names);
    return names;
  } catch {
    return [];
  }
}

/** Municípios do estado (lista filtrada por UF). */
export function useMunicipios(uf: string) {
  return useQuery({
    queryKey: ["municipios", uf] as const,
    queryFn: () => fetchMunicipios(uf),
    enabled: uf.length === 2,
    staleTime: Infinity,
  });
}
