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
