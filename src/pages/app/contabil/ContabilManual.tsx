import { DepartmentManual, type ManualSection } from "@/components/shell/department-manual";

const SECTIONS: ManualSection[] = [
  {
    title: "Visão geral",
    description:
      "O departamento Contábil acompanha o Balancete/Balanço anual das empresas vinculadas ao departamento.",
    items: [
      {
        label: "Acesso",
        detail:
          "O painel Contábil aparece no menu de departamentos do topo para usuários vinculados. Dentro dele há os submenus Dashboard e Balancete/Balanço.",
      },
      {
        label: "Empresas",
        detail:
          "Somente as empresas marcadas com o departamento Contábil no cadastro de empresas aparecem.",
      },
    ],
  },
  {
    title: "Balancete/Balanço",
    description: "Marcações mensais do ano para cada empresa do Contábil.",
    items: [
      {
        label: "Data de Início (bloqueio de retroatividade)",
        detail:
          "A Data de Início cadastrada na empresa vale para todos os departamentos: meses anteriores a ela ficam bloqueados (campos desabilitados) para edição e inserção. O mês da própria data já é editável. O Fechamento e as Observações ficam bloqueados em exercícios anteriores ao da Data de Início.",
      },
      {
        label: "Filtro por ano",
        detail:
          "O seletor de ano define o exercício exibido (ex.: 2024 a 2030). Os dados são por empresa × ano.",
      },
      {
        label: "Filtro por usuário do departamento",
        detail:
          "Ao lado do ano, filtre pelas empresas em que um usuário é responsável pelo subdepartamento Balancete/Balanço (ou pelas sem responsável).",
      },
      {
        label: "Colunas",
        detail:
          "Nº, UF, Empresa, os 12 meses (JAN a DEZ) com menu suspenso OK/LANÇADO, a coluna Fechamento com menu suspenso LANÇADO/ENCERRADA e, por último, Observações (texto livre).",
      },
      {
        label: "Filtros por coluna",
        detail:
          "Filtros no cabeçalho para Nº, UF (menu suspenso), Empresa, cada mês (Todos/Em branco/OK) e Fechamento. As colunas Nº, UF e Empresa ficam fixas ao rolar.",
      },
      {
        label: "Comentários nas células",
        detail:
          "Clique com o botão direito em qualquer célula dos meses ou do Fechamento e escolha 'Adicionar Comentário'. A célula ganha um marcador no canto superior direito e, ao passar o mouse sobre ele, o comentário aparece em um balão. Pelo mesmo menu é possível editar ou remover o comentário.",
      },
    ],
  },
  {
    title: "Dashboard",
    description:
      "Visão geral do ano escolhido no Dashboard geral, departamento Contábil.",
    items: [
      {
        label: "Acesso",
        detail:
          "Menu 'Dashboard geral' no topo da página, botão Contábil e, na lista ao lado, 'Balancete/Balanço'. Usuários do departamento Contábil (e administradores) visualizam.",
      },
      {
        label: "Filtros",
        detail:
          "Ano, Mês e Responsável, nessa ordem. O responsável considera os usuários definidos no subdepartamento Balancete/Balanço no cadastro de empresas e mostra apenas as empresas em que ele é responsável.",
      },
      {
        label: "Cartões",
        detail:
          "Sem mês selecionado (Todos os meses): Encerradas (Fechamento = ENCERRADA), Pendentes (Fechamento em branco ou LANÇADO) e Total de empresas. Com um mês selecionado, o mês passa a valer para os cartões: Encerradas (mês com OK), Lançadas (mês com LANÇADO), Pendentes (mês em branco) e Total de empresas. Todos com a porcentagem sobre o total.",
      },
      {
        label: "Empresas por responsável",
        detail:
          "Gráfico de barras horizontais com a quantidade de empresas de cada responsável, da maior para a menor. Aparece quando o filtro Responsável está em 'Todos os responsáveis'.",
      },
    ],
  },
];

export default function ContabilManual() {
  return (
    <DepartmentManual
      department="Depart. Contábil"
      description=""
      sections={SECTIONS}
      tips={[
        "Marque os meses com OK conforme o balancete for conferido.",
        "Use o filtro por ano para separar exercícios.",
        "O campo Fechamento guarda anotações do fechamento anual.",
      ]}
    />
  );
}
