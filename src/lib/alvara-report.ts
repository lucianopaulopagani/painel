export interface AlvaraReportRow {
  numero: string;
  empresa: string;
  cnpj: string;
  uf: string;
  municipio: string;
  observacao: string;
  vencimento: string;
  gerado: string;
  enviado: string;
}

export interface AlvaraReportFilters {
  ano?: string;
  uf?: string;
  municipio?: string;
}

const HEADERS = [
  "Nº",
  "Empresa",
  "CNPJ",
  "UF",
  "Município",
  "Observação",
  "Venc.",
  "Gerado",
  "Enviado",
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildFilterSummary(filters: AlvaraReportFilters): string[] {
  const lines: string[] = [];
  if (filters.ano) lines.push(`Ano: ${filters.ano}`);
  if (filters.uf) lines.push(`UF: ${filters.uf}`);
  if (filters.municipio) lines.push(`Município: ${filters.municipio}`);
  return lines;
}

function stamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function generatedLabel(): string {
  const now = new Date();
  return (
    `${String(now.getDate()).padStart(2, "0")}/` +
    `${String(now.getMonth() + 1).padStart(2, "0")}/` +
    `${now.getFullYear()} ` +
    `${String(now.getHours()).padStart(2, "0")}:` +
    `${String(now.getMinutes()).padStart(2, "0")}`
  );
}

/** Abre o relatório do Alvará em nova janela para imprimir/salvar em PDF. */
export function printAlvaraReport(
  rows: AlvaraReportRow[],
  filters: AlvaraReportFilters
): boolean {
  const filterLines = buildFilterSummary(filters);
  const filterHtml =
    filterLines.length > 0
      ? `<p class="filters">${filterLines.map(escapeHtml).join(" | ")}</p>`
      : "";

  const body = rows
    .map(
      (row) => `<tr>
        <td class="nowrap">${escapeHtml(row.numero || "—")}</td>
        <td>${escapeHtml(row.empresa)}</td>
        <td class="nowrap">${escapeHtml(row.cnpj || "—")}</td>
        <td class="nowrap">${escapeHtml(row.uf || "—")}</td>
        <td>${escapeHtml(row.municipio || "—")}</td>
        <td>${escapeHtml(row.observacao || "—")}</td>
        <td class="nowrap">${escapeHtml(row.vencimento || "—")}</td>
        <td class="nowrap">${escapeHtml(row.gerado || "—")}</td>
        <td class="nowrap">${escapeHtml(row.enviado || "—")}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório de Alvará de Localização</title>
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
  @media print { @page { margin: 12mm; } }
</style>
</head>
<body>
  <h1>Relatório de Alvará de Localização</h1>
  <p class="meta">Gerado em ${generatedLabel()} — ${rows.length} registro(s)</p>
  ${filterHtml}
  <table>
    <thead>
      <tr>${HEADERS.map((header) => `<th>${header}</th>`).join("")}</tr>
    </thead>
    <tbody>${body || `<tr><td colspan="9">Nenhum registro.</td></tr>`}</tbody>
  </table>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}

/** Gera o arquivo Excel (.xls) do relatório do Alvará. */
export function downloadAlvaraReportExcel(
  rows: AlvaraReportRow[],
  filters: AlvaraReportFilters
): void {
  const filterLines = buildFilterSummary(filters);
  const filterHtml =
    filterLines.length > 0
      ? `<p style="font-size:12px;color:#334155;margin:0 0 8px;">${filterLines
          .map(escapeHtml)
          .join(" | ")}</p>`
      : "";

  const body = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.numero || "—")}</td>
        <td>${escapeHtml(row.empresa)}</td>
        <td>${escapeHtml(row.cnpj || "—")}</td>
        <td>${escapeHtml(row.uf || "—")}</td>
        <td>${escapeHtml(row.municipio || "—")}</td>
        <td>${escapeHtml(row.observacao || "—")}</td>
        <td>${escapeHtml(row.vencimento || "—")}</td>
        <td>${escapeHtml(row.gerado || "—")}</td>
        <td>${escapeHtml(row.enviado || "—")}</td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>Alvará de Localização</title></head>
<body>
  <h1 style="font-size:16px;margin:0 0 4px;">Relatório de Alvará de Localização</h1>
  <p style="font-size:12px;color:#475569;margin:0 0 4px;">Gerado em ${generatedLabel()} — ${rows.length} registro(s)</p>
  ${filterHtml}
  <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-size:12px;">
    <thead>
      <tr style="background:#ffe599;font-weight:bold;">
        ${HEADERS.map((header) => `<th>${header}</th>`).join("")}
      </tr>
    </thead>
    <tbody>${body || '<tr><td colspan="9">Nenhum registro.</td></tr>'}</tbody>
  </table>
</body>
</html>`;

  const blob = new Blob(["\ufeff" + html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `alvara-localizacao-${stamp()}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
