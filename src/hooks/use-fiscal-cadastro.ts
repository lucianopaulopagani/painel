import {
  useCadastroFieldOptions,
  useCadastroFieldTone,
  useCadastroLabels,
} from "@/hooks/use-cadastro-tabelas";
import { FISCAL_DEPARTMENT_NAME } from "@/lib/departments";

/**
 * Cadastro de nomes de colunas e opções de menu suspenso do departamento
 * Fiscal, usado pelas tabelas do Movimento Fiscal. O cadastro é feito no
 * painel de administração em "Cadastro de Tabelas › Departamento Fiscal".
 */

/** Nome da coluna no cabeçalho (cadastro do Fiscal ou o rótulo padrão). */
export function useColumnLabel() {
  return useCadastroLabels(FISCAL_DEPARTMENT_NAME);
}

/** Opções da coluna de menu suspenso da tabela (tributação) informada. */
export function useFieldOptions() {
  return useCadastroFieldOptions(FISCAL_DEPARTMENT_NAME);
}

/** Cor cadastrada para a opção de uma coluna da tabela (tributação). */
export function useFieldTone() {
  return useCadastroFieldTone(FISCAL_DEPARTMENT_NAME);
}

/** Opções da coluna Status (campo "situacao") da tabela informada. */
export function useStatusOptions() {
  const resolveFieldOptions = useFieldOptions();
  return (
    tributacao: string | null | undefined,
    fallback: readonly string[]
  ): readonly string[] => resolveFieldOptions(tributacao, "situacao", fallback);
}

/** Cor cadastrada para um status da tabela (tributação) informada. */
export function useStatusTone() {
  const resolveFieldTone = useFieldTone();
  return (
    tributacao: string | null | undefined,
    value: string | null | undefined
  ): string | undefined => resolveFieldTone(tributacao, "situacao", value);
}
