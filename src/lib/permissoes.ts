/**
 * Modelo de permissões do sistema.
 *
 * Cada permissão pertence a um departamento e guarda em `opcoes` as chaves do
 * que libera:
 *   - "admin"                  → painel de administração inteiro
 *   - "dept:acesso"            → acesso ao departamento (todos os submenus)
 *   - "empresas:responsavel"   → só as empresas em que o usuário é responsável
 *   - "dash:acesso"            → todos os dashboards (geral e subdepartamentos)
 */
export const CHAVE_ADMIN = "admin";
export const CHAVE_DEPARTAMENTO = "dept:acesso";
export const CHAVE_EMPRESAS_RESPONSAVEL = "empresas:responsavel";
export const CHAVE_DASHBOARDS = "dash:acesso";

/** Nível de edição usado pelos módulos (o modelo atual libera edição). */
export type PermissaoNivel = "view" | "edit";

export interface PermissaoOpcao {
  key: string;
  label: string;
  descricao: string;
}

export const PERMISSAO_OPCOES: PermissaoOpcao[] = [
  {
    key: CHAVE_ADMIN,
    label: "Administrador",
    descricao:
      "Acesso total ao painel de administração: usuários, permissões, departamentos, empresas, tabelas e dashboards.",
  },
];

export interface PermissaoRegistro {
  id: string;
  nome: string;
  descricao: string | null;
  opcoes: string[];
  department_id: string | null;
}

export interface Acessos {
  admin: boolean;
  somenteResponsavel: boolean;
  /** Acesso a todos os dashboards (geral e subdepartamentos). */
  dashboards: boolean;
  /** Ids dos departamentos liberados. */
  departamentos: Set<string>;
  /** Alguma permissão cadastrada. */
  temPermissoes: boolean;
}

export function resolverAcessos(permissoes: PermissaoRegistro[]): Acessos {
  const departamentos = new Set<string>();
  let admin = false;
  let somenteResponsavel = false;
  let dashboards = false;

  for (const permissao of permissoes) {
    let departamentoLiberado = false;

    for (const opcao of permissao.opcoes ?? []) {
      if (opcao === CHAVE_ADMIN) admin = true;
      if (opcao === CHAVE_EMPRESAS_RESPONSAVEL) somenteResponsavel = true;
      if (opcao === CHAVE_DASHBOARDS) dashboards = true;
      if (opcao === CHAVE_DEPARTAMENTO) departamentoLiberado = true;

      // Compatibilidade com o modelo antigo (por submenu/dashboard).
      if (opcao.startsWith("sub:")) departamentoLiberado = true;
      if (opcao.startsWith("dash:")) dashboards = true;
    }

    if (departamentoLiberado && permissao.department_id) {
      departamentos.add(permissao.department_id);
    }
  }

  return {
    admin,
    somenteResponsavel,
    dashboards,
    departamentos,
    temPermissoes: permissoes.length > 0,
  };
}

export function rotuloOpcao(key: string): string {
  if (key === CHAVE_ADMIN) return "Administrador";
  if (key === CHAVE_DEPARTAMENTO) return "Acesso ao departamento";
  if (key === CHAVE_EMPRESAS_RESPONSAVEL) return "Somente empresas do responsável";
  if (key === CHAVE_DASHBOARDS) return "Acesso aos dashboards";
  if (key.startsWith("sub:")) return "Acesso ao submenu";
  if (key.startsWith("dash:")) return "Acesso aos dashboards";
  return key;
}

/** Compatibilidade com telas antigas. */
export function opcaoLabel(key: string): string {
  return rotuloOpcao(key);
}

/** Uma permissão é administrativa quando traz a opção "admin". */
export function temOpcaoAdmin(opcoes: string[] | null | undefined): boolean {
  return (opcoes ?? []).includes(CHAVE_ADMIN);
}
