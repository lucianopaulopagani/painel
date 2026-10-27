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
        label: "Datas por subdepartamento",
        detail:
          "As datas de início e final são definidas por subdepartamento no cadastro da empresa. Antes do mês da Data de Início a empresa não aparece nas tabelas; depois do mês da Data Final ela sai — os meses já lançados continuam no histórico. Sem datas, a empresa aparece em todos os meses.",
      },
      {
        label: "Mês de referência",
        detail:
          "Cada submenu tem o seletor de mês de referência (o mês anterior ao mês em curso), com a escolha lembrada no navegador.",
      },
      {
        label: "Nomes das colunas e opções (administração)",
        detail:
          "Os nomes das colunas e as opções (nome e cor) das colunas com menu suspenso são cadastrados no painel de administração, em Cadastro de Tabelas › Departamento Pessoal › abrir a tabela (botão de seta). O nome da coluna vale para as tabelas do departamento que usam a mesma coluna (por exemplo, Envio vale para Empresas com funcionários, Domésticas e Complemento INSS). Nas colunas com menu suspenso (Status, Folha, Empréstimo, FGTS, Taxa Sindical, DCTFWEB, Envio, DAE, Ponto e DARF) é possível incluir, renomear, escolher a cor e excluir as opções — a cor escolhida é a usada na pílula da coluna na tabela. Alterar a lista muda as opções daqui para frente e os lançamentos já gravados continuam aparecendo na linha; a opção Sem Movimento das Domésticas acompanha o nome escolhido.",
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
        label: "Informações fechamento (Ações)",
        detail:
          "O botão de lápis (Ações) na coluna Informações fechamento abre um diálogo para escrever o texto da empresa no mês exibido. O texto é levado para os meses seguintes até ser alterado.",
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
      {
        label: "Dashboard",
        detail:
          "No Dashboard geral, o submenu 'Empresas Fiscal' mostra os cartões Concluído, Pendente, Em Andamento, Em Ajuste e Total de empresas (com quantidade e porcentagem sobre o total) e os gráficos por responsável e por responsável e status, considerando a coluna Status do mês de referência.",
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
        label: "Colunas, filtros e cabeçalho fixo",
        detail:
          "Uma linha por empresa com todas as colunas na mesma linha (Status, Data Base, N, Nome, CPF, Senha, Folha, DAE, Envio e Ponto). Os filtros ficam no cabeçalho da tabela, que permanece visível ao rolar a lista para baixo.",
      },
      {
        label: "Sem movimento",
        detail:
          "As empresas com o status Sem Movimento saem da lista principal e ficam na tabela Sem movimento, logo abaixo, com a contagem — e ali permanecem nos meses seguintes até o status ser alterado.",
      },
      {
        label: "Dashboard",
        detail:
          "No Dashboard geral, o submenu 'Domésticas' mostra os cartões Concluído, Pendente, Em Andamento, Em Ajuste, Sem Movimento e Total de empresas (com quantidade e porcentagem) e os gráficos por responsável e por responsável e status. As empresas Sem Movimento ficam fora da base de cálculo das demais situações: os percentuais de Concluído, Pendente, Em Andamento e Em Ajuste consideram apenas as empresas em movimento.",
      },
    ],
  },
  {
    title: "Ponto e Complemento INSS",
    description: "Submenus de marcações mensais.",
    items: [
      {
        label: "Ponto",
        detail:
          "Registro do envio do ponto das empresas no mês: Envio com Enviado (verde) ou Pendente (vermelho). O valor antigo Desativado não é mais oferecido — os meses que já o tinham continuam exibidos na seção Empresas desativadas, no fim da tabela, até serem alterados.",
      },
      {
        label: "Dashboard do Ponto",
        detail:
          "No Dashboard geral, o submenu 'Ponto' mostra os cartões Enviado, Pendente e Total de empresas (com quantidade e porcentagem sobre o total) e os gráficos por responsável e por responsável e envio, considerando a coluna Envio do mês de referência.",
      },
      {
        label: "Complemento INSS",
        detail:
          "Nº, Empresa, Observações (botão de Ações), DARF (OK/Possui/Não Possui) e Envio (Enviado/Pendente). O valor antigo Desativado não é mais oferecido — os meses que já o tinham continuam exibidos na seção Empresas desativadas, no fim da tabela, até serem alterados.",
      },
      {
        label: "Observações (Ações)",
        detail:
          "O botão de lápis (Ações) na coluna Observações abre um diálogo para escrever o texto da empresa no mês exibido. O texto é levado para os meses seguintes até ser alterado.",
      },
      {
        label: "Dashboard do Complemento INSS",
        detail:
          "No Dashboard geral, o submenu 'Complemento INSS' mostra os cartões Enviado, Pendente e Total de empresas (com quantidade e porcentagem sobre o total) e os gráficos por responsável e por responsável e envio, considerando a coluna Envio do mês de referência.",
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
        "O status de Empresas com funcionários e Empresas Fiscal é individual de cada mês; em Ponto e Complemento INSS o Envio é Enviado ou Pendente, e empresas inativadas no cadastro saem da lista automaticamente.",
        "Data Base, Empréstimo e notas herdam do mês anterior — basta ajustar quando mudar.",
        "As listas suspensas seguem o padrão de cores: OK e Enviado em verde, Não Possui em azul, Possui e Pendente em vermelho, Em Andamento em âmbar e Desativado no tom neutro.",
        "Use os filtros de coluna para localizar empresas por status, envio ou mês.",
      ]}
    />
  );
}
