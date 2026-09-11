import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  )
}

/**
 * Aplica a máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00),
 * alternando automaticamente conforme a quantidade de dígitos (até 11 = CPF,
 * 12 a 14 = CNPJ). Limita a 14 dígitos.
 */
export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

/** Válido quando há 11 dígitos (CPF) ou 14 dígitos (CNPJ). */
export function isValidCpfCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  return digits.length === 11 || digits.length === 14
}

/** "YYYY-MM-DD" → "dd/mm/aaaa". */
export function formatDateOnlyBr(value: string | null | undefined): string {
  if (!value) return "—"
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  return `${match[3]}/${match[2]}/${match[1]}`
}

const pad2 = (value: number) => String(value).padStart(2, "0")

/** ISO timestamp → "dd/mm/aaaa hh:mm" (horário local). */
export function formatDateTimeBr(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/** Separa um timestamp ISO em partes de data e hora locais (para inputs date/time). */
export function splitDateTimeLocal(value: string | null | undefined): {
  date: string
  time: string
} {
  if (!value) return { date: "", time: "" }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: "", time: "" }
  return {
    date: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
  }
}

/** Junta data ("YYYY-MM-DD") e hora ("HH:MM") em ISO; null se não houver data. */
export function joinDateTimeLocal(
  date: string,
  time: string
): string | null {
  if (!date) return null
  const local = new Date(`${date}T${time || "00:00"}:00`)
  if (Number.isNaN(local.getTime())) return null
  return local.toISOString()
}
