/**
 * Modelo de permissões do sistema.
 *
 * Cada permissão pertence a um departamento e guarda em `opcoes` as chaves do
 * que libera:
 *   - "admin"                  → painel de administração inteiro
 *   - "empresas:responsavel"   → só as empresas em que o usuário é responsável
 *   - "sub:<id>:view"          → submenu em modo somente leitura
 *   - "sub:<id>:edit"          → submenu com edição
 *   - "dash:geral"             → dashboard geral do departamento
 *   - "dash:sub:<id>"          → dashboard do subdepartamento
 *
 * Submenus criados depois entram automaticamente no cadastro sem acesso.
 */
export type PermissaoNivel = "view" | "edit";

export const CHAVE_ADMIN = "admin";
export const CHAVE_EMPRESAS_RESPONSAVEL = "empresas:responsavel";
export const CHAVE_DASH_GERAL = "dash:geral";

export interface PermissaoOpcao {
  key: typeof CHAVE_ADMIN;
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

export const chaveSubmenu = (submenuId: string, nivel: PermissaoNivel) =>
  `sub:${submenuId}:${nivel}`;

export const chaveDashboardSub = (submenuId: string) =>
  `dash:sub:${submenuId}`;

export interface PermissaoRegistro {
  id: string;
  nome: string;
  descricao: string | null;
  opcoes: string[];
  department_id: string | null;
}

export interface AcessoDepartamento {
  /** Dashboard geral do departamento liberado. */
  dashboardGeral: boolean;
  /** Nível por submenu (id do submenu). */
  submenus: Map<string, PermissaoNivel>;
  /** Ids dos submenus com dashboard liberado. */
  dashboards: Set<string>;
}

export interface Acessos {
  admin: boolean;
  somenteResponsavel: boolean;
  porDepartamento: Map<string, AcessoDepartamento>;
  /** Alguma permissão cadastrada (fora as de administrador). */
  temPermissoes: boolean;
}

export function resolverAcessos(permissoes: PermissaoRegistro[]): Acessos {
  const porDepartamento = new Map<string, AcessoDepartamento>();
  let admin = false;
  let somenteResponsavel = false;

  for (const permissao of permissoes) {
    for (const opcao of permissao.opcoes ?? []) {
      if (opcao === CHAVE_ADMIN) admin = true;
      if (opcao === CHAVE_EMPRESAS_RESPONSAVEL) somenteResponsavel = true;
    }

    if (!permissao.department_id) continue;

    const acesso =
      porDepartamento.get(permissao.department_id) ??
      ({
        dashboardGeral: false,
        submenus: new Map<string, PermissaoNivel>(),
        dashboards: new Set<string>(),
      } satisfies AcessoDepartamento);

    for (const opcao of permissao.opcoes ?? []) {
      if (opcao === CHAVE_DASH_GERAL) acesso.dashboardGeral = true;
      if (opcao.startsWith("dash:sub:")) {
        acesso.dashboards.add(opcao.slice("dash:sub:".length));
      }
      if (opcao.startsWith("sub:")) {
        const [, submenuId, nivel] = opcao.split(":");
        if (!submenuId || (nivel !== "view" && nivel !== "edit")) continue;
        const atual = acesso.submenus.get(submenuId);
        acesso.submenus.set(
          submenuId,
          atual === "edit" || nivel === "edit" ? "edit" : "view"
        );
      }
    }

    porDepartamento.set(permissao.department_id, acesso);
  }

  return {
    admin,
    somenteResponsavel,
    porDepartamento,
    temPermissoes: permissoes.length > 0,
  };
}

/** Nível do usuário em um submenu (undefined = sem acesso liberado por permissão). */
export function nivelDoSubmenu(
  acessos: Acessos,
  departamentoId: string | undefined,
  submenuId: string
): PermissaoNivel | undefined {
  if (!departamentoId) return undefined;
  return acessos.porDepartamento.get(departamentoId)?.submenus.get(submenuId);
}

export function temAcessoAoDepartamento(
  acessos: Acessos,
  departamentoId: string | undefined
): boolean {
  if (!departamentoId) return false;
  return acessos.porDepartamento.has(departamentoId);
}

export function rotuloOpcao(key: string): string {
  if (key === CHAVE_ADMIN) return "Administrador";
  if (key === CHAVE_EMPRESAS_RESPONSAVEL) return "Somente empresas do responsável";
  if (key === CHAVE_DASH_GERAL) return "Dashboard geral do departamento";
  if (key.startsWith("dash:sub:")) return "Dashboard de subdepartamento";
  if (key.startsWith("sub:")) {
    return key.endsWith(":edit")
      ? "Submenu · alterar"
      : "Submenu · visualizar";
  }
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
