const integerFormatter = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('fr-BE', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Entier localisé fr-BE, ex. « 1 600 » (calories). */
export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

/** Décimal à une position localisé fr-BE, ex. « 77,8 » (poids, macros en grammes). */
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
