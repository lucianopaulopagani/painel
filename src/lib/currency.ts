/**
 * Valores em reais dos campos do Movimento Fiscal.
 *
 * Os campos são textos livres no banco; aqui eles são lidos e gravados no
 * formato "1234,56" (sem milhar) e exibidos como "R$ 1.234,56".
 */

/** Texto digitado/salvo → centavos (aceita "1.234,56", "1234,56", "1234.56"). */
export function parseCurrencyToCents(value: string | null | undefined): number {
  if (!value) return 0;
  const negative = value.trim().startsWith("-");
  const cleaned = value.replace(/[^\d,.]/g, "");
  if (!cleaned || !/\d/.test(cleaned)) return 0;

  // Com vírgula, ela é o separador decimal e os pontos são de milhar.
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return 0;
  const cents = Math.round(amount * 100);
  return negative ? -cents : cents;
}

/** Centavos → "R$ 1.234,56". */
export function formatCentsAsCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Exibição do valor salvo: números aparecem como moeda e textos sem dígitos
 * (ex.: observações antigas) são mantidos como estão.
 */
export function formatCurrencyField(value: string | null | undefined): string {
  if (!value) return "";
  if (!/\d/.test(value)) return value;
  return formatCentsAsCurrency(parseCurrencyToCents(value));
}

/** Valor salvo a partir de um texto em reais ("R$ 1.234,56" → "1234,56"). */
export function currencyToStorage(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/\d/.test(value)) return value.trim() || null;
  const cents = parseCurrencyToCents(value);
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Máscara de digitação: só os dígitos contam e viram centavos
 * (ex.: digitar "123456" → "R$ 1.234,56").
 */
export function maskCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (!digits) return "";
  return formatCentsAsCurrency(Number(digits));
}
