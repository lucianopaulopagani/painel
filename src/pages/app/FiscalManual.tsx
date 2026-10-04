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
    description:
      "Visão do Movimento Fiscal do mês de referência (disponível a todos os usuários do departamento Fiscal).",
    items: [
      {
        label: "Filtros",
        detail:
          "Mês de referência e Responsável, lado a lado. Ao escolher um responsável, os resultados passam a considerar apenas as empresas dele.",
      },
      {
        label: "Cartões",
        detail:
          "Finalizadas, Pendentes e Total de empresas, cada um com a quantidade e a porcentagem abaixo. Considera a coluna Situação: OK e OK-SM contam como finalizadas; as demais como pendentes — em todas as tributações.",
      },
      {
        label: "Gráfico por responsável",
        detail:
          "Quando o filtro está em 'Todos os responsáveis', exibe um gráfico de barras horizontais (laranja) com a quantidade de empresas por responsável (empresas com mais de um responsável contam para cada um).",
      },
      {
        label: "Gráfico por responsável e tributação",
        detail:
          "Ainda com 'Todos os responsáveis', um segundo gráfico de barras horizontais mostra, para cada responsável, a quantidade de empresas separada por tributação (barras empilhadas em tons de laranja).",
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
        label: "Data de Início (bloqueio de retroatividade)",
        detail:
          "A Data de Início cadastrada na empresa vale para todos os departamentos: meses anteriores a ela ficam bloqueados (campos desabilitados) para edição e inserção. O mês da própria data já é editável — ex.: 15/03/2026 bloqueia até 02/2026.",
      },
      {
        label: "Filtros",
        detail:
          "Filtro por Responsável (administrador) e por Tributação — este lista apenas os tipos realmente existentes nas empresas da lista (sem a opção 'Todas as tributação': a primeira tributação existente já vem selecionada) — além dos filtros por coluna no cabeçalho da tabela.",
      },
    ],
  },
  {
    title: "Subtabelas por tributação",
    description:
      "Ao selecionar uma tributação no filtro do Movimento Fiscal, a tabela padrão é substituída pela subtabela específica daquela tributação.",
    items: [
      {
        label: "Empresas exibidas",
        detail:
          "As subtabelas mostram apenas as empresas do Movimento Fiscal (departamento Fiscal, com o submenu Movimento Fiscal) que estão na lista já filtrada por Responsável: o administrador vê o responsável selecionado (ou todos) e os demais usuários veem apenas as empresas sob sua responsabilidade.",
      },
      {
        label: "Simples Nacional",
        detail:
          "Selecionando 'Simples Nacional' no filtro de Tributação, é exibida a subtabela específica dessa tributação (Nº, UF, Empresa, CNPJ, Inscrição Estadual, Situação, DAS, Antecipação, ST, DIF ALIQ, DIF ALIQ C/ST, Guia, DESTDA, Envio/SN, Envio/ICMS e Observações), com filtro de UF em menu suspenso e colunas compactas.",
      },
      {
        label: "MEI",
        detail:
          "Selecionando 'MEI' no filtro de Tributação, é exibida a subtabela enxuta dessa tributação, apenas com N, UF, Empresa, Situação e Observação (as demais colunas do Movimento Fiscal não se aplicam ao MEI). A Situação tem somente OK (finalizada) e FAZENDO (pendente) e alimenta os dashboards do Movimento Fiscal com esses mesmos parâmetros: OK conta como finalizada e FAZENDO como pendente.",
      },
      {
        label: "Lucro Real e Lucro Presumido",
        detail:
          "Selecionando 'Lucro Real' ou 'Lucro Presumido' no filtro de Tributação, é exibida a tabela do modelo das empresas normais: N, Empresas e UF (do cadastro de empresas com essa tributação), a Situação (mesmos campos do Simples Nacional: OK, OK-ENT, OK-SM e FAZENDO), as obrigações ISSQN, DIME/GIA PR, DAPI, GIA RS, DRCST, SPED FISCAL, SPED CONTR, REINF, DIRBI, MIT e OBS — com filtro de UF em menu suspenso listando apenas as UFs das empresas exibidas.",
      },
      {
        label: "Situação e dashboard",
        detail:
          "A Situação da tabela alimenta o Dashboard do Fiscal com os mesmos parâmetros do Simples Nacional: OK e OK-SM contam como finalizadas e o restante como pendente (incluindo em branco).",
      },
      {
        label: "Opções e cor de desabilitado",
        detail:
          "Cada coluna de obrigação é uma lista suspensa com as opções OK (verde), SM (azul), X (âmbar), Dispensada (neutro), Pendências (vermelho) e Desabilitado — esta última destaca o campo com a cor roxa de desabilitado e segue para os próximos meses até ser alterada. OBS é texto livre, também levado para os meses seguintes.",
      },
      {
        label: "Comentários nas células",
        detail:
          "Clique com o botão direito em qualquer célula de ISSQN até OBS para Adicionar Comentário (igual ao Balancete/Balanço do Contábil). A célula ganha um marcador no canto superior direito com o comentário no tooltip, e o comentário é levado para os meses seguintes até ser alterado ou removido (remover no mês exibido encerra a herança a partir dele).",
      },
      {
        label: "Data de Início",
        detail:
          "Meses anteriores à Data de Início da empresa ficam com os campos desabilitados também nesta tabela.",
      },
      {
        label: "Demais tributações",
        detail:
          "As outras tributações seguem usando a tabela padrão do Movimento Fiscal e ganharão subtabelas específicas no futuro.",
      },
    ],
  },
  {
    title: "Carne Leão (subtabela do Movimento Fiscal)",
    description:
      "Tabela específica das empresas com tributação Carne Leão, exibida dentro do Movimento Fiscal.",
    items: [
      {
        label: "Como abrir",
        detail:
          "No Movimento Fiscal, selecione a tributação 'Carne Leão' no filtro de Tributação — a subtabela do Carne Leão substitui a tabela padrão, usando o mesmo mês de referência.",
      },
      {
        label: "Empresas",
        detail:
          "Aparecem automaticamente as empresas cadastradas com tributação 'Carne Leão' (N, UF, Empresa e CPF vêm do cadastro de empresas).",
      },
      {
        label: "Colunas",
        detail:
          "N, UF, Empresa, CPF, Situação (OK/FAZENDO/OK-ENT/OK-SM), Prestados e Tomados (OK/SM), ISS Fixo, Carne Leão e Envio/Guia (OK/OK-SM) e Observações (texto).",
      },
      {
        label: "Cores",
        detail:
          "OK e OK-SM em verde, OK-ENT em âmbar, FAZENDO em vermelho e SM em azul, seguindo o padrão dos departamentos.",
      },
      {
        label: "Filtros",
        detail: "Filtros por coluna no cabeçalho, no padrão das demais tabelas.",
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
