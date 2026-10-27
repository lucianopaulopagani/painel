import {
  useCadastroFieldOptions,
  useCadastroFieldTone,
  useCadastroOpcoes,
} from "@/hooks/use-cadastro-tabelas";
import { statusColorClass } from "@/lib/cadastro-tabelas";

/** Cadastro (nomes de colunas e opções) de uma tabela de um departamento. */
export interface TabelaCadastro {
  /** Opções da coluna: as cadastradas na administração ou a lista padrão. */
  options: (campo: string, fallback: readonly string[]) => readonly string[];
  /**
   * Opções da coluna mantendo na frente o valor já gravado quando ele não está
   * na lista (opção renomeada ou valor antigo) — assim a linha continua exibindo
   * e permitindo alterar o que está gravado.
   */
  optionsComValor: (
    campo: string,
    value: string | null | undefined,
    fallback: readonly string[]
  ) => readonly string[];
  /** Cor cadastrada para o valor (undefined quando a opção não tem cadastro). */
  tone: (campo: string, value: string | null | undefined) => string | undefined;
  /**
   * Tons cadastrados sobrepostos ao mapa padrão da tabela (chave = nome da
   * opção), para as tabelas que escolhem a cor por um mapa.
   */
  toneMap: (
    campo: string,
    fallback: Record<string, string>
  ) => Record<string, string>;
}

/**
 * Liga uma tabela (módulo) ao Cadastro de Tabelas: resolve as opções das
 * colunas de menu suspenso e as cores cadastradas para cada opção. Sem cadastro,
 * a tabela usa as listas e cores padrão.
 */
export function useTabelaCadastro(
  departamento: string,
  tabela: string
): TabelaCadastro {
  const resolveOptions = useCadastroFieldOptions(departamento);
  const resolveTone = useCadastroFieldTone(departamento);
  const { data: opcoes } = useCadastroOpcoes();

  const options = (campo: string, fallback: readonly string[]) =>
    resolveOptions(tabela, campo, fallback);

  return {
    options,
    optionsComValor: (campo, value, fallback) => {
      const lista = options(campo, fallback);
      return value && !lista.includes(value) ? [value, ...lista] : lista;
    },
    tone: (campo, value) => resolveTone(tabela, campo, value),
    toneMap: (campo, fallback) => {
      const list = (opcoes ?? []).filter(
        (opcao) =>
          opcao.departamento === departamento &&
          opcao.tabela === tabela &&
          opcao.campo === campo
      );
      if (list.length === 0) return fallback;
      const merged = { ...fallback };
      for (const opcao of list) {
        merged[opcao.nome] = statusColorClass(opcao.cor);
      }
      return merged;
    },
  };
}
