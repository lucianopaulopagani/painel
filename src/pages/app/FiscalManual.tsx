import { DepartmentManual, type ManualSection } from "@/components/shell/department-manual";

const SECTIONS: ManualSection[] = [
  {
    title: "Visão geral",
    description:
      "O departamento Fiscal acompanha o movimento fiscal mensal das empresas vinculadas ao departamento.",
    items: [
      {
        label: "Acesso",
        detail:
          "O painel Fiscal aparece no menu de departamentos do topo para usuários vinculados. Dentro dele há os submenus Dashboard, Movimento Fiscal e Manual.",
      },
      {
        label: "Empresas e responsáveis",
        detail:
          "Somente as empresas marcadas com o departamento Fiscal aparecem. Usuários comuns veem e editam apenas as empresas em que são responsáveis; o administrador vê todas.",
      },
    ],
  },
  {
    title: "Dashboard",
    description: "Situação do fechamento do mês de referência.",
    items: [
      {
        label: "Gráfico de situação",
        detail:
          "Mostra empresas finalizadas e pendentes. OK e OK-SM contam como finalizadas; as demais situações como pendentes.",
      },
      {
        label: "Filtro por responsável",
        detail:
          "Administradores veem todas as empresas; os demais veem apenas as suas.",
      },
    ],
  },
  {
    title: "Movimento Fiscal",
    description:
      "Registro mensal das obrigações de cada empresa do departamento Fiscal.",
    items: [
      {
        label: "Mês de referência",
        detail:
          "O mês atual é sempre a referência anterior ao mês em curso (ex.: em setembro/2026, o mês de referência é agosto/2026). Use os botões 'Atual' e 'Próximo' para alternar rapidamente.",
      },
      {
        label: "Geração e liberação do próximo mês",
        detail:
          "O administrador gera e libera o próximo mês (cria os registros em branco para todas as empresas). Depois de liberado, os usuários podem editar.",
      },
      {
        label: "Colunas e marcações",
        detail:
          "Situação e obrigações (DAS, Antecipação, ST, DIF ALIQ, DIF ALIQ C/ST, Guia, DESTDA, Envio/SN, Envio/ICMS) e Obs. Situação tem menu suspenso; DAS/Guia/DESTDA/Envio têm marcações OK/OK-SM; alguns campos são de digitação.",
      },
      {
        label: "Cores das opções",
        detail:
          "OK e OK-SM aparecem em verde (finalizada), OK-ENT em âmbar e FAZENDO em vermelho, seguindo o padrão dos departamentos.",
      },
      {
        label: "Observações (Obs.)",
        detail:
          "A observação é sempre copiada do mês atual (referência) e replicada para os demais meses. Ao editar a obs em qualquer mês, a alteração vale para todos.",
      },
      {
        label: "Filtros",
        detail:
          "Filtro por Responsável (administrador), por Tributação (apenas os tipos existentes na lista) e filtros por coluna no cabeçalho da tabela.",
      },
    ],
  },
];

export default function FiscalManual() {
  return (
    <DepartmentManual
      department="Depart. Fiscal"
      description=""
      sections={SECTIONS}
      tips={[
        "Confira as empresas em FAZENDO ou OK-ENT — ainda pendentes.",
        "Use o filtro de tributação para separar empresas por regime.",
        "Mantenha a obs. atualizada no mês de referência: ela vale para todos os meses.",
      ]}
    />
  );
}
