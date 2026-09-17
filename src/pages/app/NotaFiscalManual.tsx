import { DepartmentManual, type ManualSection } from "@/components/shell/department-manual";

const SECTIONS: ManualSection[] = [
  {
    title: "Visão geral",
    description:
      "O departamento Nota Fiscal ainda está em desenvolvimento.",
    items: [
      {
        label: "Dashboard",
        detail:
          "O submenu Dashboard existe, mas o conteúdo do departamento será criado futuramente. Esta área está reservada para as ferramentas de Nota Fiscal.",
      },
      {
        label: "Empresas",
        detail:
          "As empresas vinculadas ao departamento Nota Fiscal no cadastro de empresas serão usadas quando os módulos forem desenvolvidos.",
      },
    ],
  },
];

export default function NotaFiscalManual() {
  return (
    <DepartmentManual
      department="Nota Fiscal"
      description=""
      sections={SECTIONS}
      tips={[
        "Este manual será atualizado a cada nova funcionalidade desenvolvida para o departamento.",
      ]}
    />
  );
}
