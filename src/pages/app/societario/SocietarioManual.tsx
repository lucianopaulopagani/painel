import {
  FileSpreadsheet,
  FileText,
  Pencil,
  ScrollText,
  CalendarClock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ManualSection {
  title: string;
  description: string;
  items: { label: string; detail: string }[];
}

const SECTIONS: ManualSection[] = [
  {
    title: "Visão geral",
    description:
      "O departamento Societário acompanha os certificados digitais das empresas vinculadas ao departamento.",
    items: [
      {
        label: "Acesso",
        detail:
          "O painel Societário aparece no menu de departamentos do topo para usuários vinculados. Dentro dele há os submenus Dashboard, Certificado digital e Manual.",
      },
      {
        label: "Empresas",
        detail:
          "Somente as empresas marcadas com o departamento Societário no cadastro de empresas aparecem aqui.",
      },
    ],
  },
  {
    title: "Dashboard",
    description:
      "Visão geral da situação dos certificados digitais das empresas do departamento.",
    items: [
      {
        label: "Quantidade por situação",
        detail:
          "Cartões Ativos (verde), Vencidos (vermelho), Renovar (amarelo) e Sem vencimento (cinza). Um certificado é 'Ativo' quando tem vencimento futuro, 'Renovar' quando vence hoje, 'Vencido' quando já passou e 'Sem vencimento' quando a empresa não possui certificado.",
      },
      {
        label: "Por tipo de produto",
        detail:
          "Quantidade de certificados e-CNPJ A1 12 meses e e-CPF A1 12 meses cadastrados.",
      },
      {
        label: "Próximos 12 meses",
        detail:
          "Gráfico de barras com a quantidade de certificados que vencem em cada um dos próximos 12 meses.",
      },
    ],
  },
  {
    title: "Alvará de Localização",
    description:
      "Controle anual do alvará de localização das empresas do departamento.",
    items: [
      {
        label: "Empresas",
        detail:
          "Aparecem as empresas com o subdepartamento 'Alvará de Localização' marcado no cadastro de empresas. Nº, Empresa, CNPJ, UF e Município vêm do cadastro.",
      },
      {
        label: "Filtros fora da tabela",
        detail:
          "Ano, UF e Município (lado a lado), além de 'Vencimento entre' duas datas — o intervalo combina o dia/mês com o ano selecionado.",
      },
      {
        label: "Colunas e filtros",
        detail:
          "Nº, Empresa, CNPJ, UF, Município, Observação, Venc., Gerado e Enviado, com filtro no cabeçalho de cada coluna.",
      },
      {
        label: "Herança entre anos",
        detail:
          "Observação e Venc. são levados para os anos seguintes até serem alterados.",
      },
      {
        label: "Dashboard (Dashboard geral)",
        detail:
          "No Dashboard geral, o submenu 'Alvará de Localização' mostra os cartões Gerado, Enviado, Total e Sem vencimento (com quantidade e porcentagem), o gráfico de alvarás a vencer nos meses do ano selecionado, e os filtros de Ano, UF e Município.",
      },
      {
        label: "Relatório",
        detail:
          "Botão 'Relatório' com geração em PDF e Excel, respeitando os filtros aplicados.",
      },
    ],
  },
  {
    title: "Alvará Sanitário",
    description:
      "Controle anual do alvará sanitário das empresas do departamento.",
    items: [
      {
        label: "Empresas",
        detail:
          "Aparecem as empresas com o subdepartamento 'Alvará Sanitário' marcado no cadastro de empresas. Nº, Empresa, CNPJ, UF e Município vêm do cadastro.",
      },
      {
        label: "Filtros fora da tabela",
        detail:
          "Ano, UF e Município (lado a lado), além de 'Vencimento entre' duas datas (formato dd/mm, combinado com o ano selecionado) e o botão Relatório.",
      },
      {
        label: "Colunas e filtros",
        detail:
          "Nº, Empresa, CNPJ, UF, Município, Observação, Venc. (dd/mm), Gerado e Enviado, com filtro no cabeçalho de cada coluna.",
      },
      {
        label: "Herança entre anos",
        detail:
          "Observação e Venc. são levados para os anos seguintes até serem alterados.",
      },
      {
        label: "Dashboard (Dashboard geral)",
        detail:
          "No Dashboard geral, o submenu 'Alvará Sanitário' mostra os cartões Gerado, Enviado, Total e Sem vencimento (com quantidade e porcentagem), o gráfico de alvarás a vencer nos meses do ano selecionado, e os filtros de Ano, UF e Município.",
      },
      {
        label: "Relatório",
        detail:
          "Botão 'Relatório' com geração em PDF e Excel, respeitando os filtros aplicados.",
      },
    ],
  },
  {
    title: "Certificado digital",
    description:
      "Tabela com o certificado de cada empresa: vencimento, situação, status, produto, avisado, agendamento e observações.",
    items: [
      {
        label: "Situação e Status",
        detail:
          "Situação: 'Vencido à N dia(s)!', 'Vence hoje', 'Faltam N dia(s)!' ou '—' (sem vencimento). Status: VENCIDO, RENOVAR, ATIVO ou SEM VENCIMENTO, com as mesmas cores da situação.",
      },
      {
        label: "Editar certificado",
        detail:
          "Use o botão de lápis na coluna Ações. No diálogo é possível informar o vencimento, avisado (Sim/Não/Em branco), produto (e-CNPJ/e-CPF), agendamento (data e hora) e observações.",
      },
      {
        label: "Campo 'Renovado'",
        detail:
          "Ao marcar o checkbox 'Renovado' e salvar, o sistema limpa automaticamente o avisado, o agendamento (data e hora) e as observações. O mesmo ocorre ao renovar com nova data futura um certificado vencido ou que vence hoje.",
      },
      {
        label: "Filtros por coluna",
        detail:
          "Cada coluna tem filtro no cabeçalho: digitação parcial em Vencimento, Empresa, Agendamento e Observações; menus suspensos (Todos/Em branco/opções) em Situação, Status, Produto e Avisado.",
      },
      {
        label: "Filtro de vencimento entre datas",
        detail:
          "Acima da tabela, o campo 'Vencimento entre [data] até [data]' restringe a lista por intervalo e também vale para o relatório gerado.",
      },
      {
        label: "Relatório por vencimento",
        detail:
          "O botão 'Relatório por vencimento' oferece duas opções: Gerar em PDF (abre a janela de impressão, podendo salvar como PDF) e Gerar em Excel (baixa um arquivo .xls com Empresa, Produto, Vencimento, Situação, Status, Avisado, Agendamento e Observações).",
      },
    ],
  },
];

const ICONS = [ScrollText, CalendarClock, Pencil];

export default function SocietarioManual() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Manual de utilização</h2>
        <p className="text-sm text-muted-foreground">
          Guia de uso do departamento Societário.
        </p>
        <p className="text-xs text-muted-foreground">
          Última atualização: setembro/2026 — este manual acompanha as versões
          desenvolvidas do departamento.
        </p>
      </div>

      {SECTIONS.map((section, index) => {
        const Icon = ICONS[index] ?? ScrollText;
        return (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {section.items.map((item) => (
                  <li key={item.label} className="rounded-lg border p-3">
                    <div className="text-sm font-medium">{item.label}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Dicas rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0" />
              Confira sempre o vencimento para renovar com antecedência
              (certificados em 'Renovar' ou 'Vencido').
            </li>
            <li className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              Use o relatório em Excel para repassar a lista aos responsáveis.
            </li>
            <li className="flex items-center gap-2">
              <Pencil className="h-4 w-4 shrink-0" />
              Ao renovar, marque 'Renovado' para manter o registro limpo.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
