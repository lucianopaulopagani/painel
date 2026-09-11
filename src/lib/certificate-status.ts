export type CertificateStatusLevel =
  | "vencido"
  | "renovar"
  | "ativo"
  | "sem-vencimento";

export interface CertificateStatus {
  level: CertificateStatusLevel;
  /** Texto da coluna SITUAÇÃO (ex.: "Vencido à 30 dia(s)!"). */
  situacao: string;
  /** Texto da coluna STATUS (VENCIDO / RENOVAR / ATIVO). */
  status: string;
}

/** Diferença em dias inteiros (por dia, sem considerar hora). */
function diffInDays(target: Date, from: Date): number {
  const t = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const f = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((t - f) / 86_400_000);
}

/** Interpreta "YYYY-MM-DD" como data local (evita o deslocamento de UTC). */
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Situação e status do certificado conforme a data de vencimento e o dia atual:
 * - vencido → "Vencido à N dia(s)!" / VENCIDO
 * - vence hoje → "Vence hoje" / RENOVAR
 * - futuro → "Faltam N dia(s)!" / ATIVO
 */
export function getCertificateStatus(
  vencimento: string | null | undefined,
  today: Date = new Date()
): CertificateStatus {
  const due = vencimento ? parseDateOnly(vencimento) : null;
  if (!due) {
    return {
      level: "sem-vencimento",
      situacao: "—",
      status: "SEM VENCIMENTO",
    };
  }

  const days = diffInDays(due, today);

  if (days < 0) {
    return {
      level: "vencido",
      situacao: `Vencido à ${Math.abs(days)} dia(s)!`,
      status: "VENCIDO",
    };
  }
  if (days === 0) {
    return { level: "renovar", situacao: "Vence hoje", status: "RENOVAR" };
  }
  return {
    level: "ativo",
    situacao: `Faltam ${days} dia(s)!`,
    status: "ATIVO",
  };
}
