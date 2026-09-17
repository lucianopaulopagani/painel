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
          "Nº, Empresa, os 12 meses (JAN a DEZ) com marcação OK/em branco, e o campo Fechamento (texto livre).",
      },
      {
        label: "Filtros por coluna",
        detail:
          "Filtros no cabeçalho para Nº, Empresa, cada mês (Todos/Em branco/OK) e Fechamento. As colunas Nº e Empresa ficam fixas ao rolar.",
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
