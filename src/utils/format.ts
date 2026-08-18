const integerFormatter = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('fr-BE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** fr-BE localized integer, e.g. « 1 600 » (calories). */
export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

/** fr-BE localized one-decimal number, e.g. « 77,8 » (weight, macros in grams). */
export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}

export function formatKcal(value: number): string {
  return `${formatInteger(value)} kcal`;
}

export function formatGrams(value: number): string {
  return `${formatDecimal(value)} g`;
}

export function formatKg(value: number): string {
  return `${formatDecimal(value)} kg`;
}

/**
 * Parses fr-BE numeric input (decimal-pad keyboard: the decimal key types a
 * comma, e.g. « 82,5 »). `Number()` alone returns NaN on the comma.
 */
export function parseLocaleNumber(value: string): number {
  return Number(value.trim().replace(',', '.'));
}
