import { DepartmentManual, type ManualSection } from "@/components/shell/department-manual";

const SECTIONS: ManualSection[] = [
  {
    title: "Visão geral",
    description:
      "O departamento Pessoal reúne a folha de pagamento mensal em vários submenus.",
    items: [
      {
        label: "Submenus",
        detail:
          "Dashboard, Empresas com funcionários, Empresas Fiscal, Domésticas, Ponto e Complemento INSS — acessíveis no menu suspenso do departamento.",
      },
      {
        label: "Mês de referência",
        detail:
          "Cada submenu tem o seletor de mês de referência (o mês anterior ao mês em curso), com a escolha lembrada no navegador.",
      },
    ],
  },
  {
    title: "Empresas com funcionários",
    description: "Acompanhamento mensal das empresas com funcionários.",
    items: [
      {
        label: "Colunas",
        detail:
          "Status, Nº, Empresa, CNPJ, Tributação, Data Base, Folha, Empréstimo, FGTS, Taxa Sindical, DCTFWEB, Envio e Notas (Ações).",
      },
      {
        label: "Status",
        detail:
          "Concluído (verde), Pendente (vermelho), Em Andamento (amarelo), Em Ajuste e Desativado. Empresas com status 'Desativado' vão para a seção 'Empresas desativadas' no fim da tabela.",
      },
      {
        label: "Herança entre meses",
        detail:
          "Status, Data Base, Empréstimo e as notas (Obs. Fechamento, Info. Sindicato, Info. Sindicato Patronal) são levados para os próximos meses até serem alterados. Folha e DCTFWEB valem apenas no mês atual.",
      },
      {
        label: "Notas",
        detail:
          "O botão de lápis (Ações) abre um diálogo com Obs. Fechamento, Info. Sindicato e Info. Sindicato Patronal, com os valores herdados do mês anterior.",
      },
      {
        label: "Filtros",
        detail:
          "Filtros por coluna no cabeçalho (digitação e menus suspensos) e busca nas notas.",
      },
    ],
  },
  {
    title: "Empresas Fiscal",
    description: "Marcações mensais das empresas sob a ótica do Pessoal.",
    items: [
      {
        label: "Colunas",
        detail:
          "Status, Nº, Empresa, CNPJ, Informações fechamento, DCTFWEB e Envio.",
      },
      {
        label: "Status e Desativado",
        detail:
          "Concluído, Pendente e Desativado. Empresas desativadas ficam na seção no fim da tabela e o status é levado para os próximos meses.",
      },
      {
        label: "Filtros",
        detail: "Filtros por coluna no cabeçalho da tabela.",
      },
    ],
  },
  {
    title: "Domésticas",
    description: "Controle mensal das domésticas atendidas pelo escritório.",
    items: [
      {
        label: "Colunas",
        detail:
          "Status, Data Base, N°, Nome, CPF, Senha, Folha, DAE, Envio e Ponto. N°, Nome, CPF e Senha são editáveis no cadastro.",
      },
      {
        label: "SEM MOVIMENTO",
        detail:
          "Domésticas sem status no mês (ou marcadas como Desativado) ficam na seção 'SEM MOVIMENTO' no fim da tabela.",
      },
      {
        label: "Filtros",
        detail: "Filtros por coluna no cabeçalho.",
      },
    ],
  },
  {
    title: "Ponto e Complemento INSS",
    description: "Submenus de marcações mensais.",
    items: [
      {
        label: "Ponto",
        detail: "Registro do envio do ponto das empresas no mês (Enviado/Pendente/Desativado).",
      },
      {
        label: "Complemento INSS",
        detail:
          "DARF (OK/Possui/Não Possui) e Envio (Enviado/Pendente/Desativado). Empresas desativadas vão para a seção no fim da tabela.",
      },
    ],
  },
];

export default function PessoalManual() {
  return (
    <DepartmentManual
      department="Depart. Pessoal"
      description=""
      sections={SECTIONS}
      tips={[
        "Altere o status para 'Desativado' para tirar a empresa do movimento sem excluir o histórico.",
        "Data Base, Empréstimo e notas herdam do mês anterior — basta ajustar quando mudar.",
        "Use os filtros de coluna para localizar empresas por status, envio ou mês.",
      ]}
    />
  );
}
