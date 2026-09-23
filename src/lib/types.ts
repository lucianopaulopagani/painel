export type Role = "admin" | "member";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DepartmentRef {
  id: string;
  name: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  dashboard_access: boolean;
  empresas_access: boolean;
  empresas_fields: string[];
  empresas_criar: boolean;
  empresas_importar: boolean;
  empresas_bulk: boolean;
  avatar_url: string | null;
  created_at: string;
}

/** Perfil já com a lista de departamentos vinculados (N:N). */
export interface ProfileWithDepartments extends Profile {
  departments: DepartmentRef[];
}

export interface ManageUserPayload {
  action:
    | "create-user"
    | "update-user"
    | "reset-password"
    | "delete-user";
  [key: string]: unknown;
}

export interface Company {
  id: string;
  numero: string | null;
  name: string;
  /** CPF (11 dígitos) ou CNPJ (14 dígitos). */
  documento: string;
  inscricao_estadual: string | null;
  /** Unidade federativa (sigla de 2 letras). */
  uf: string;
  /** Município. */
  municipio: string | null;
  /** Regime de tributação. */
  tributacao: string | null;
  /** Sócio responsável da empresa (não exibido na listagem). */
  socio_responsavel: string | null;
  /** CPF do sócio responsável. */
  socio_cpf: string | null;
  /** Empresa ativa? (false = inativada a partir de data_inativacao) */
  ativa: boolean;
  /** Motivo da inativação. */
  motivo_inativacao: string | null;
  /** Último dia ativo (YYYY-MM-DD). */
  data_inativacao: string | null;
  created_at: string;
}

/** Vínculo empresa × departamento, com os usuários responsáveis (opcional). */
export interface CompanyDepartmentLink {
  department_id: string;
  profile_ids: string[];
  /** Subdepartamentos (submenus) que a empresa utiliza neste departamento. */
  subdepartments: string[];
}

/** Empresa já com os departamentos vinculados. */
export interface CompanyWithDepartments extends Company {
  department_links: CompanyDepartmentLink[];
}

export interface Certificate {
  id: string;
  company_id: string;
  /** Data de vencimento (YYYY-MM-DD). */
  vencimento: string | null;
  /** null = em branco; true = sim; false = não. */
  avisado: boolean | null;
  /** null = em branco; true = sim; false = não (financeiro). */
  financ: boolean | null;
  agendamento_at: string | null;
  observacoes: string | null;
  /** Produtos selecionados (ex.: e-CNPJ A1 12 meses). */
  produtos: string[];
  created_at: string;
  updated_at: string;
}

/** Linha do módulo "Certificado digital" (empresa + certificado, se houver). */
export interface CertificateRow {
  company: CompanyWithDepartments;
  certificate: Certificate | null;
}

/** Registro do Movimento Fiscal de uma empresa em um mês de referência. */
export interface MovementFiscalRecord {
  id: string;
  company_id: string;
  /** Mês de referência (YYYY-MM). */
  mes_referencia: string;
  situacao: string | null;
  das: string | null;
  antecipacao: string | null;
  st: string | null;
  dif_aliq: string | null;
  dif_aliq_st: string | null;
  guia: string | null;
  destda: string | null;
  envio_sn: string | null;
  envio_icms: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type MovementFiscalInput = Omit<
  MovementFiscalRecord,
  "id" | "created_at" | "updated_at"
>;

/** Registro do Ponto (folha mensal) de uma empresa em um mês. */
export interface PontoRecord {
  id: string;
  company_id: string;
  /** Mês de referência (YYYY-MM). */
  mes_referencia: string;
  /** Status de envio (ex.: "Enviado"). */
  envio: string | null;
  created_at: string;
  updated_at: string;
}

export type PontoInput = Omit<PontoRecord, "id" | "created_at" | "updated_at">;

/** Registro do submenu Empresas Fiscal (folha mensal) de uma empresa. */
export interface EmpresasFiscalRecord {
  id: string;
  company_id: string;
  /** Mês de referência (YYYY-MM). */
  mes_referencia: string;
  status: string | null;
  informacoes: string | null;
  dctfweb: string | null;
  envio: string | null;
  created_at: string;
  updated_at: string;
}

export type EmpresasFiscalInput = Omit<
  EmpresasFiscalRecord,
  "id" | "created_at" | "updated_at"
>;

/** Registro do submenu Empresas com Funcionários (folha mensal). */
export interface EmpresasFuncionariosRecord {
  id: string;
  company_id: string;
  mes_referencia: string;
  status: string | null;
  data_base: string | null;
  folha: string | null;
  emprestimo: string | null;
  fgts: string | null;
  taxa_sindical: string | null;
  dctfweb: string | null;
  envio: string | null;
  observacao: string | null;
  info_sindicato: string | null;
  info_sindicato_patronal: string | null;
  created_at: string;
  updated_at: string;
}

export type EmpresasFuncionariosInput = Omit<
  EmpresasFuncionariosRecord,
  "id" | "created_at" | "updated_at"
>;

/** Registro do submenu Complemento INSS (folha mensal). */
export interface ComplementoInssRecord {
  id: string;
  company_id: string;
  mes_referencia: string;
  darf: string | null;
  envio: string | null;
  created_at: string;
  updated_at: string;
}

export type ComplementoInssInput = Omit<
  ComplementoInssRecord,
  "id" | "created_at" | "updated_at"
>;

/** Registro anual do Alvará localização (Societário). */
export interface AlvaraLocalizacaoRecord {
  id: string;
  company_id: string;
  ano: string;
  vencimento: string | null;
  gerado: string | null;
  enviado: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export type AlvaraLocalizacaoInput = Omit<
  AlvaraLocalizacaoRecord,
  "id" | "created_at" | "updated_at"
>;

/** Registro anual do Alvará Sanitário (Societário). */
export interface AlvaraSanitarioRecord {
  id: string;
  company_id: string;
  ano: string;
  vencimento: string | null;
  gerado: string | null;
  enviado: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export type AlvaraSanitarioInput = Omit<
  AlvaraSanitarioRecord,
  "id" | "created_at" | "updated_at"
>;

/** Registro anual do Alvará Bombeiros (Societário). */
export interface AlvaraBombeirosRecord {
  id: string;
  company_id: string;
  ano: string;
  vencimento: string | null;
  gerado: string | null;
  enviado: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export type AlvaraBombeirosInput = Omit<
  AlvaraBombeirosRecord,
  "id" | "created_at" | "updated_at"
>;

/** Cadastro de domésticas (pessoas físicas atendidas pelo Pessoal). */
export interface DomesticasRecord {
  id: string;
  numero: string | null;
  nome: string;
  cpf: string | null;
  senha: string | null;
  created_at: string;
  updated_at: string;
}

/** Movimento mensal de uma doméstica (folha mensal). */
export interface DomesticaMovimentoRecord {
  id: string;
  domestica_id: string;
  mes_referencia: string;
  status: string | null;
  data_base: string | null;
  folha: string | null;
  dae: string | null;
  envio: string | null;
  ponto: string | null;
  created_at: string;
  updated_at: string;
}

export type DomesticaMovimentoInput = Omit<
  DomesticaMovimentoRecord,
  "id" | "created_at" | "updated_at"
>;

/** Registro anual do Balancete/Balanço (Contábil). */
export interface BalanceteBalancoRecord {
  id: string;
  company_id: string;
  ano: string;
  jan: string | null;
  fev: string | null;
  mar: string | null;
  abr: string | null;
  mai: string | null;
  jun: string | null;
  jul: string | null;
  ago: string | null;
  set: string | null;
  out: string | null;
  nov: string | null;
  dez: string | null;
  fechamento: string | null;
  created_at: string;
  updated_at: string;
}

export type BalanceteBalancoInput = Omit<
  BalanceteBalancoRecord,
  "id" | "created_at" | "updated_at"
>;
