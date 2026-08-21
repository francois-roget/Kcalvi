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

/**
 * Translates a Food reference/serving unit code (e.g. `g`, `ml`, `unit`) via the shared
 * `recipeForm.units.*` i18n keys, falling back to the raw stored value for any code outside
 * the known set -- defensive only, since Food's reference/serving units are already
 * constrained to that set by FoodFormScreen.
 *
 * KCAL-158: previously duplicated locally in RecipeFormScreen and, worse, absent from
 * RecipeDetailScreen -- which rendered `ingredient.unit` raw, showing "unit" instead of
 * "unité" for unit-referenced foods. Shared here so every screen that displays a unit code
 * gets the fix.
 */
export function unitLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  unit: string,
): string {
  return t(`recipeForm.units.${unit}`, { defaultValue: unit });
}
