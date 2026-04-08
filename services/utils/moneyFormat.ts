/** Convierte unidades menores (p. ej. céntimos) a texto con moneda. */
export function formatMoneyMinor(
  minor: number | null | undefined,
  currency: string | null | undefined
): string | null {
  if (minor == null || currency == null || currency === '') return null;
  const major = minor / 100;
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

/** Interpreta "12,50" / "12.50" como importe mayor y devuelve céntimos. */
export function parseMoneyInputToMinor(text: string): number | null {
  const t = text.replace(/\s/g, '').replace(',', '.').trim();
  if (!t) return null;
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
