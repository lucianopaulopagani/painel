import { getCertificateStatus } from "@/lib/certificate-status";
import { formatDateOnlyBr, formatDateTimeBr } from "@/lib/utils";
import type { CertificateRow } from "@/lib/types";

export interface CertificateReportFilters {
  empresa?: string;
  vencimentoDe?: string;
  vencimentoAte?: string;
  agendamentoDe?: string;
  agendamentoAte?: string;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  vencido: { bg: "#ffc7ce", fg: "#9c0006" },
  renovar: { bg: "#ffeb9c", fg: "#9c6500" },
  ativo: { bg: "#c6efce", fg: "#006100" },
  "sem-vencimento": { bg: "#e2e8f0", fg: "#334155" },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildFilterSummary(filters: CertificateReportFilters): string[] {
  const lines: string[] = [];
  if (filters.empresa) lines.push(`Empresa: ${filters.empresa}`);
  if (filters.vencimentoDe || filters.vencimentoAte) {
    lines.push(
      `Vencimento: ${
        filters.vencimentoDe ? formatDateOnlyBr(filters.vencimentoDe) : "início"
      } a ${filters.vencimentoAte ? formatDateOnlyBr(filters.vencimentoAte) : "fim"}`
    );
  }
  if (filters.agendamentoDe || filters.agendamentoAte) {
    lines.push(
      `Agendamento: ${
        filters.agendamentoDe
          ? formatDateOnlyBr(filters.agendamentoDe)
          : "início"
      } a ${
        filters.agendamentoAte ? formatDateOnlyBr(filters.agendamentoAte) : "fim"
      }`
    );
  }
  return lines;
}

/** Monta o HTML do relatório de certificados por vencimento. */
export function buildCertificateReportHtml(
  rows: CertificateRow[],
  filters: CertificateReportFilters,
  generatedAt: Date
): string {
  const sorted = [...rows].sort((a, b) => {
    const aDue = a.certificate?.vencimento ?? null;
    const bDue = b.certificate?.vencimento ?? null;
    if (!aDue && !bDue) return a.company.name.localeCompare(b.company.name, "pt-BR");
    if (!aDue) return 1;
    if (!bDue) return -1;
    return (
      aDue.localeCompare(bDue) ||
      a.company.name.localeCompare(b.company.name, "pt-BR")
    );
  });

  const body = sorted
    .map((row) => {
      const status = getCertificateStatus(row.certificate?.vencimento);
      const colors = STATUS_COLORS[status.level] ?? STATUS_COLORS["sem-vencimento"];
      const situacao = `${formatDateOnlyBr(row.certificate?.vencimento)} — ${status.situacao}`;
      const pill = `<span class="pill" style="background:${colors.bg};color:${colors.fg}">`;
      return `<tr>
        <td>${escapeHtml(row.company.name)}</td>
        <td class="nowrap">${pill}${escapeHtml(situacao)}</span></td>
        <td>${pill}${escapeHtml(status.status)}</span></td>
        <td>${row.certificate?.avisado === true ? "Sim" : row.certificate?.avisado === false ? "Não" : "—"}</td>
        <td class="nowrap">${escapeHtml(formatDateTimeBr(row.certificate?.agendamento_at))}</td>
        <td>${escapeHtml(row.certificate?.observacoes ?? "—")}</td>
      </tr>`;
    })
    .join("");

  const filterLines = buildFilterSummary(filters);
  const filterHtml =
    filterLines.length > 0
      ? `<p class="filters">${filterLines.map(escapeHtml).join(" | ")}</p>`
      : "";

  const generated =
    `${String(generatedAt.getDate()).padStart(2, "0")}/` +
    `${String(generatedAt.getMonth() + 1).padStart(2, "0")}/` +
    `${generatedAt.getFullYear()} ` +
    `${String(generatedAt.getHours()).padStart(2, "0")}:` +
    `${String(generatedAt.getMinutes()).padStart(2, "0")}`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório de certificados por vencimento</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #475569; margin: 0 0 4px; }
  .filters { font-size: 12px; color: #334155; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #ffe599; }
  .nowrap { white-space: nowrap; }
  .pill { display: inline-block; padding: 2px 6px; border-radius: 999px; font-weight: 600; }
  @media print { @page { margin: 12mm; } }
</style>
</head>
<body>
  <h1>Relatório de certificados por vencimento</h1>
  <p class="meta">Gerado em ${generated} — ${sorted.length} registro(s)</p>
  ${filterHtml}
  <table>
    <thead>
      <tr>
        <th>Empresa</th><th>Vencimento / Situação</th><th>Status</th>
        <th>Avisado</th><th>Agendamento</th><th>Observações</th>
      </tr>
    </thead>
    <tbody>${body || `<tr><td colspan="6">Nenhum registro.</td></tr>`}</tbody>
  </table>
</body>
</html>`;
}

/** Abre o relatório em uma nova janela para imprimir/salvar em PDF. */
export function printCertificateReport(
  rows: CertificateRow[],
  filters: CertificateReportFilters
): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(buildCertificateReportHtml(rows, filters, new Date()));
  win.document.close();
  win.focus();
  win.print();
  return true;
}
