/**
 * Catálogo de opções que podem ser atribuídas a uma permissão do sistema.
 *
 * Hoje só a opção "Administrador" está liberada. As demais entram aqui depois,
 * com `disponivel: true`, e passam a aparecer no cadastro de permissões.
 */
export type PermissaoOpcaoKey = "admin";

export interface PermissaoOpcao {
  key: PermissaoOpcaoKey;
  label: string;
  descricao: string;
  /** Opções ainda não implementadas aparecem desabilitadas no cadastro. */
  disponivel: boolean;
}

export const PERMISSAO_OPCOES: PermissaoOpcao[] = [
  {
    key: "admin",
    label: "Administrador",
    descricao:
      "Acesso total ao painel de administração: usuários, permissões, departamentos, empresas, tabelas e dashboards.",
    disponivel: true,
  },
];

export function opcaoLabel(key: string): string {
  return PERMISSAO_OPCOES.find((opcao) => opcao.key === key)?.label ?? key;
}

/** Uma permissão é administrativa quando traz a opção "admin". */
export function temOpcaoAdmin(opcoes: string[] | null | undefined): boolean {
  return (opcoes ?? []).includes("admin");
}
