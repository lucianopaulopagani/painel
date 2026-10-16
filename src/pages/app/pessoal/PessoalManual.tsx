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
        label: "Data de Início (bloqueio de retroatividade)",
        detail:
          "A Data de Início cadastrada na empresa vale para todos os departamentos: meses anteriores a ela ficam bloqueados (campos desabilitados) para edição e inserção. O mês da própria data já é editável — ex.: 15/03/2026 bloqueia até 02/2026.",
      },
      {
        label: "Mês de referência",
        detail:
          "Cada submenu tem o seletor de mês de referência (o mês anterior ao mês em curso), com a escolha lembrada no navegador.",
      },
    ],
  },
  {
    title: "Dashboard",
    description:
      "Visão do módulo Empresas com funcionários no mês de referência, no Dashboard geral.",
    items: [
      {
        label: "Filtros",
        detail:
          "Mês de referência e Responsável (os usuários responsáveis pelo subdepartamento Empresas com funcionários no cadastro de empresas).",
      },
      {
        label: "Cartões",
        detail:
          "Concluído (verde), Pendente (vermelho), Em Andamento (âmbar), Em Ajuste e Total de empresas, cada um com a quantidade e a porcentagem sobre o total.",
      },
      {
        label: "Gráficos",
        detail:
          "Com o filtro em 'Todos os responsáveis': Empresas por responsável e Empresas por responsável e status (barras empilhadas, incluindo as empresas em branco).",
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
          "Concluído (verde), Pendente (vermelho), Em Andamento (amarelo) e Em Ajuste. A opção Desativado não existe neste módulo — empresas inativadas no cadastro saem da lista automaticamente.",
      },
      {
        label: "Herança entre meses",
        detail:
          "Data Base, Empréstimo e as notas (Obs. Fechamento, Info. Sindicato, Info. Sindicato Patronal) são levados para os próximos meses até serem alterados. Status, Folha e DCTFWEB valem apenas no mês atual.",
      },
      {
        label: "Anotações nas células",
        detail:
          "Clique com o botão direito em qualquer coluna de marcação (Status, Data Base, Folha, Empréstimo, FGTS, Taxa Sindical, DCTFWEB e Envio) para adicionar uma anotação, igual ao Balancete/Balanço e ao Movimento Fiscal. A célula ganha um marcador no canto superior direito com a anotação no tooltip, e a anotação é levada para os meses seguintes até ser alterada ou removida.",
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
        label: "Status",
        detail:
          "Concluído (verde), Pendente (vermelho), Em Andamento (âmbar) e Em Ajuste. O status é individual de cada mês.",
      },
      {
        label: "Filtros",
        detail: "Filtros por coluna no cabeçalho da tabela.",
      },
    ],
  },
  {
    title: "Domésticas",
    description:
      "Controle mensal das empresas marcadas com o subdepartamento Domésticas.",
    items: [
      {
        label: "Empresas",
        detail:
          "Aparecem as empresas do departamento Pessoal marcadas com o subdepartamento 'Domésticas' no cadastro de empresas. N, Nome e CPF vêm desse cadastro.",
      },
      {
        label: "Status",
        detail:
          "Concluído (verde), Pendente (vermelho), Em Andamento (âmbar), Em Ajuste e Sem Movimento (tom neutro). Ao marcar Sem Movimento, a empresa sai da tabela principal e vai para a tabela 'Sem movimento' logo abaixo, e ali permanece nos meses seguintes até ser alterada.",
      },
      {
        label: "Data Base e Senha",
        detail:
          "Data Base (lista dos 12 meses) e Senha ficam fixadas para os meses seguintes até serem alteradas. A Senha é digitada pelo botão de lápis da coluna, que abre um diálogo — assim não é alterada por acidente.",
      },
      {
        label: "Folha, DAE, Envio e Ponto",
        detail:
          "Folha e DAE com OK (verde), Possui (vermelho) e Não Possui (azul); Envio e Ponto com Enviado (verde) e Pendente (vermelho).",
      },
      {
        label: "Filtros e bloqueio",
        detail:
          "Filtros por coluna no cabeçalho (Status, Data Base, N, Nome, CPF, Senha, Folha, DAE, Envio e Ponto). Meses anteriores à Data de Início da empresa ficam bloqueados para edição.",
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
        "O status de Empresas com funcionários e Empresas Fiscal é individual de cada mês; em Ponto e Complemento INSS, use Envio = Desativado para tirar a empresa do movimento sem excluir o histórico.",
        "Data Base, Empréstimo e notas herdam do mês anterior — basta ajustar quando mudar.",
        "As listas suspensas seguem o padrão de cores: OK e Enviado em verde, Não Possui em azul, Possui e Pendente em vermelho, Em Andamento em âmbar e Desativado no tom neutro.",
        "Use os filtros de coluna para localizar empresas por status, envio ou mês.",
      ]}
    />
  );
}
