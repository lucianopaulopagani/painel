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
          "O painel Fiscal aparece no menu de departamentos do topo para usuários vinculados. Dentro dele há os submenus Movimento Fiscal, Controle de Parcelamentos e Manual; os dashboards ficam no Dashboard geral.",
      },
      {
        label: "Empresas e responsáveis",
        detail:
          "Somente as empresas marcadas com o subdepartamento do módulo aparecem. No cadastro de empresas, cada subdepartamento marcado tem o seu próprio seletor de responsáveis, e cada módulo (Movimento Fiscal, Controle de Parcelamentos) usa os responsáveis do seu subdepartamento. Usuários comuns veem e editam apenas as empresas em que são responsáveis no subdepartamento; o administrador vê todas.",
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
          "Mês de referência e Responsável, lado a lado. O Responsável considera os usuários responsáveis pelo subdepartamento Movimento Fiscal no cadastro de empresas; ao escolher um deles, os resultados passam a considerar apenas as empresas dele.",
      },
      {
        label: "Cartões",
        detail:
          "Finalizadas, Pendentes e Total de empresas, cada um com a quantidade e a porcentagem abaixo. Considera a coluna Status: OK e OK-SM contam como finalizadas; as demais como pendentes — em todas as tributações.",
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
          "Status e obrigações (DAS, Antecipação, ST, DIF ALIQ, DIF ALIQ C/ST, Guia, DESTDA, Envio/SN, Envio/ICMS) e Obs. Status tem menu suspenso; DAS/Guia/DESTDA/Envio têm marcações OK/OK-SM; alguns campos são de digitação.",
      },
      {
        label: "Status e colunas das tabelas (administração)",
        detail:
          "Os nomes das colunas e as opções das colunas com menu suspenso são cadastrados no painel de administração em Cadastro de Tabelas › Departamento Fiscal › abrir a tabela (botão de seta) — cada tabela corresponde a uma tributação do Movimento Fiscal, e ali também se cria, renomeia ou exclui a tabela. O primeiro campo de cada coluna é o nome exibido no cabeçalho, que vale para todas as tabelas do departamento Fiscal, inclusive as colunas de texto (Nº, UF, Empresa, CNPJ, Insc. Estadual, CPF, Observação e Ações). É possível incluir, renomear, escolher a cor e excluir as opções de cada coluna com menu suspenso (Status, DAS, Guia, DESTDA, Envios, Prestados, Tomados, ISS Fixo, Carne Leão e as obrigações do Lucro Real/Presumido) — a cor escolhida é a usada na pílula da coluna na tabela: Simples Nacional, Lucro Real e Lucro Presumido usam OK, OK-ENT, OK-SM e FAZENDO; o MEI usa OK, FAZENDO e SM (gravado como OK-SM); Carne Leão usa OK, FAZENDO, OK-ENT e OK-SM; SM-Mensal, Empregada Doméstica e Pessoa Física usam OK. Alterar a lista muda as opções das tabelas do Movimento Fiscal daqui para frente — os lançamentos já gravados não são alterados — e, quando uma tributação não tem nenhum status cadastrado, a tabela usa a lista padrão.",
      },
      {
        label: "Cores das opções",
        detail:
          "OK aparece em verde (finalizada), OK-SM e SM em azul, OK-ENT em âmbar e FAZENDO em vermelho, seguindo o padrão dos departamentos.",
      },
      {
        label: "Observações (Obs.)",
        detail:
          "A observação é sempre copiada do mês atual (referência) e replicada para os demais meses. Ao editar a obs em qualquer mês, a alteração vale para todos.",
      },
      {
        label: "Datas por subdepartamento",
        detail:
          "As datas de início e final são definidas por subdepartamento no cadastro da empresa. Antes do mês da Data de Início a empresa não aparece nas tabelas; depois do mês da Data Final ela sai — os meses já lançados continuam no histórico. Sem datas, a empresa aparece em todos os meses.",
      },
      {
        label: "Filtros",
        detail:
          "Filtro por Responsável (administrador) — com a lista dos responsáveis das empresas exibidas e a opção 'Sem responsável', que mostra as empresas do departamento Fiscal sem nenhum responsável informado no cadastro de empresas — e por Tributação, este lista apenas os tipos realmente existentes nas empresas da lista (sem a opção 'Todas as tributação': a primeira tributação existente já vem selecionada) — além dos filtros por coluna no cabeçalho da tabela.",
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
          "Selecionando 'Simples Nacional' no filtro de Tributação, é exibida a subtabela específica dessa tributação (Nº, UF, Empresa, CNPJ, Inscrição Estadual, Status, DAS, Antecipação, ST, DIF ALIQ, DIF ALIQ C/ST, Observações, Ações, Guia, DESTDA, Envio/SN e Envio/ICMS), com filtro de UF em menu suspenso e colunas compactas. O DAS tem as opções OK e SM (o SM é gravado como OK-SM, o mesmo valor usado no restante do Movimento Fiscal).",
      },
      {
        label: "Simples Nacional — valores em R$ e observações (Ações)",
        detail:
          "Na subtabela do Simples Nacional, Antecipação, ST, DIF ALIQ e DIF ALIQ C/ST são exibidos em reais (R$), somente leitura na tabela, e são editados juntos pelo botão de Ações (ícone de cédula) da coluna Ações — o diálogo mostra os quatro campos com máscara de moeda: digite apenas os números e os centavos são preenchidos automaticamente (ex.: 123456 → R$ 1.234,56). A coluna Observações aparece como texto (truncado, com o conteúdo completo no tooltip) e é editada pelo botão de lápis, que abre um diálogo — o texto é levado para os meses seguintes até ser alterado.",
      },
      {
        label: "MEI",
        detail:
          "Selecionando 'MEI' no filtro de Tributação, é exibida a subtabela enxuta dessa tributação, apenas com N, UF, Empresa, Status, DAS, Envio e Observação (as demais colunas do Movimento Fiscal não se aplicam ao MEI). O Status tem OK, FAZENDO e SM (o SM é gravado como OK-SM, o mesmo valor usado no restante do Movimento Fiscal); o DAS tem OK e SM; o Envio tem apenas OK. A coluna Observação é editada pelo botão de lápis (Ações), que abre um diálogo — o texto é levado para os meses seguintes até ser alterado. O Status alimenta os dashboards do Movimento Fiscal: OK e SM contam como finalizada e FAZENDO como pendente.",
      },
      {
        label: "SM-Mensal (Simples Nacional/SM-Mensal), Empregada Doméstica e Pessoa Física",
        detail:
          "Selecionando 'Simples Nacional/SM-Mensal', 'Empregada Doméstica' ou 'Pessoa Física' no filtro de Tributação, é exibida a tabela mensal simplificada, no modelo das planilhas mensais: N, UF, Empresa, CNPJ e Inscrição Estadual (todos vindos do cadastro de empresas), o Status — com a opção OK — e a Observação, em texto, aberta pelo botão de Ações (lápis) e levada para os meses seguintes até ser alterada. Os filtros ficam no cabeçalho de cada coluna.",
      },
      {
        label: "Lucro Real e Lucro Presumido",
        detail:
          "Selecionando 'Lucro Real' ou 'Lucro Presumido' no filtro de Tributação, é exibida a tabela do modelo das empresas normais: N, Empresas e UF (do cadastro de empresas com essa tributação), o Status (mesmos campos do Simples Nacional: OK, OK-ENT, OK-SM e FAZENDO), as obrigações ISSQN, DIME/GIA PR, DAPI, GIA RS, DRCST, SPED FISCAL, SPED CONTR, REINF, DIRBI, MIT e OBS — com filtro de UF em menu suspenso listando apenas as UFs das empresas exibidas.",
      },
      {
        label: "Status e dashboard",
        detail:
          "O Status da tabela alimenta o Dashboard do Fiscal com os mesmos parâmetros do Simples Nacional: OK e OK-SM contam como finalizadas e o restante como pendente (incluindo em branco).",
      },
      {
        label: "Opções e cor de desabilitado",
        detail:
          "Cada coluna de obrigação é uma lista suspensa com as opções OK (verde), SM (azul), X (âmbar), Dispensada (neutro), Pendências (vermelho) e Desabilitado — esta última destaca o campo com a cor roxa de desabilitado e segue para os próximos meses até ser alterada. A coluna OBS aparece como texto (truncado, com o conteúdo completo no tooltip) e é editada pelo botão de Ações (lápis), que abre um diálogo — o texto também é levado para os meses seguintes até ser alterado.",
      },
      {
        label: "Comentários nas células",
        detail:
          "Clique com o botão direito em qualquer célula de ISSQN até OBS para Adicionar Comentário (igual ao Balancete/Balanço do Contábil). A célula ganha um marcador no canto superior direito com o comentário no tooltip, e o comentário é levado para os meses seguintes até ser alterado ou removido (remover no mês exibido encerra a herança a partir dele).",
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
          "N, UF, Empresa, CPF, Status (OK/FAZENDO/OK-ENT/OK-SM), Prestados e Tomados (OK/SM), ISS Fixo, Carne Leão e Envio/Guia (OK/OK-SM) e Observações (texto).",
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
  {
    title: "Controle de Parcelamentos",
    description:
      "Planilha mensal dos parcelamentos das empresas do departamento Fiscal (submenu Controle de Parcelamentos).",
    items: [
      {
        label: "Empresas",
        detail:
          "Aparecem apenas as empresas do departamento Fiscal marcadas com o subdepartamento 'Controle de Parcelamentos' no cadastro de empresas. Todos os usuários do Fiscal veem todas essas empresas.",
      },
      {
        label: "Mês de referência",
        detail:
          "Mesmo modelo mensal do Movimento Fiscal: escolha o mês no seletor e os valores gravados ficam guardados por mês, alimentando o dashboard e o histórico.",
      },
      {
        label: "Colunas",
        detail:
          "N, UF, Empresa e CNPJ vêm do cadastro de empresas. As colunas SIMPLES, MEI/RELP/ISS, ESTADUAL, INSS RFB, INSS PGFN, SN PGFN, PERT, SN RELP, RELP PGFN e MUNICIPAL são listas suspensas com GERADO e DESABILITADO. ENVIO é a lista suspensa com GERADO e ENVIADO (em branco quando nada foi escolhido).",
      },
      {
        label: "Cor de desabilitado",
        detail:
          "A opção DESABILITADO destaca o campo com a cor roxa de desabilitado e segue para os próximos meses até ser alterada, igual ao Lucro Real.",
      },
      {
        label: "Comentários nas células",
        detail:
          "Todas as colunas aceitam comentário (clique com o botão direito em qualquer célula, de N até ENVIO). A célula ganha um marcador no canto superior direito com o comentário no tooltip, e o comentário é levado para os meses seguintes até ser alterado ou removido.",
      },
      {
        label: "Filtros",
        detail:
          "Filtros por coluna no cabeçalho, incluindo o filtro de UF (lista apenas as UFs das empresas exibidas) e de ENVIO.",
      },
      {
        label: "Dashboard",
        detail:
          "No Dashboard geral, o submenu 'Controle de Parcelamentos' mostra os cartões Finalizadas (ENVIADO), Pendentes (GERADO e em branco) e Total de empresas, com quantidade e porcentagem, além dos gráficos por responsável e por responsável e ENVIO — no mesmo formato do dashboard do Movimento Fiscal.",
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
