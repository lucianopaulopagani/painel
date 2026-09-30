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
        label: "Filtro por ano",
        detail:
          "O seletor de ano define o exercício exibido (ex.: 2024 a 2030). Os dados são por empresa × ano.",
      },
      {
        label: "Filtro por usuário do departamento",
        detail:
          "Ao lado do ano, filtre pelas empresas em que um usuário do departamento é responsável (ou pelas sem responsável).",
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
