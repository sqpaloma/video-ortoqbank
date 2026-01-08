import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma string de CPF para o formato padrão: XXX.XXX.XXX-XX
 * @param cpf - String de CPF (com ou sem formatação)
 * @returns String de CPF formatada (XXX.XXX.XXX-XX) ou undefined se inválido
 */
export function formatCpf(cpf: string | null | undefined): string | undefined {
  if (!cpf) return undefined;

  // Remove todos os caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, "");

  // Verifica se tem o comprimento válido de CPF (11 dígitos)
  if (cleaned.length !== 11) {
    return undefined; // Retorna undefined se inválido (comportamento consistente com entrada falsy)
  }

  // Formata: XXX.XXX.XXX-XX
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}
