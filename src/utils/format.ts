import { format as dateFnsFormat, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { Food } from '@/domain/types';

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

/**
 * French kcal label for a food card (KCAL-158): "64 kcal pour 100 g" / "24 kcal pour 100 ml" /
 * "78 kcal par unité" -- never "78 kcal pour 1 unité": a `referenceUnit === 'unit'` food always
 * has `referenceQuantity = 1`, so the "pour N unité" phrasing would read oddly.
 *
 * KCAL-175: moved here from LibraryScreen/FoodListItem so AddEntryScreen's result rows show the
 * same reference line. Its i18n keys stay under `library.food.*` (shared, like the
 * `recipeForm.units.*` keys `unitLabel` reads above) rather than being renamed across screens.
 */
export function foodKcalLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  food: Pick<Food, 'calories' | 'referenceQuantity' | 'referenceUnit'>,
): string {
  const kcal = formatInteger(food.calories);
  if (food.referenceUnit === 'unit') {
    return t('library.food.kcalPerUnit', { kcal });
  }
  return t('library.food.kcalPerReference', {
    kcal,
    quantity: formatInteger(food.referenceQuantity),
    unit: unitLabel(t, food.referenceUnit),
  });
}

/**
 * Converts a domain number to the comma-decimal text NumberField/`parseLocaleNumber` expect --
 * the exact inverse of `parseLocaleNumber` above.
 *
 * KCAL-178: moved here from RecipeFormScreen.helpers so QuantitySheet shares it rather than
 * making a third copy of the fr-BE comma round-trip.
 */
export function numberToText(value: number): string {
  return String(value).replace('.', ',');
}

/** `parseLocaleNumber` for optional input: blank text yields `undefined` rather than NaN. */
export function toNumberOrUndefined(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  return parseLocaleNumber(trimmed);
}

/**
 * Long French date for a screen header, e.g. « jeudi 21 août » (KCAL-182). Rendered through
 * the `overline` typography variant, which applies the uppercasing -- the string itself stays
 * lowercase so it can be reused anywhere the design doesn't uppercase.
 *
 * Uses date-fns' `fr` locale rather than Intl.DateTimeFormat for consistency with the rest of
 * the date handling (`startOfDay`, `parseISO`, `getWeekBoundaries`).
 */
export function formatLongDate(date: Date): string {
  return dateFnsFormat(date, 'EEEE d MMMM', { locale: fr });
}

/**
 * The `yyyy-MM-dd` local day key used as an AddEntry route param (KCAL-172): navigation params
 * must stay serializable, and a diary entry belongs to a day rather than an instant.
 */
export function toDayKey(date: Date): string {
  return dateFnsFormat(date, 'yyyy-MM-dd');
}

/**
 * Inverse of `toDayKey`. `parseISO` resolves a date-only string at local midnight, unlike
 * `new Date('2026-08-21')`, which parses it as UTC and lands on the previous day for any device
 * west of Greenwich. The repository normalizes to startOfDay again on write (KCAL-169).
 */
export function parseDayKey(dayKey: string): Date {
  return parseISO(dayKey);
}

/** Capitalized French month + year for a screen title, e.g. « Août 2026 » (KCAL-187). */
export function formatMonthYear(date: Date): string {
  const formatted = dateFnsFormat(date, 'MMMM yyyy', { locale: fr });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Single-letter French weekday for the DayStrip, e.g. « L » for Monday. */
export function formatWeekdayNarrow(date: Date): string {
  return dateFnsFormat(date, 'EEEEE', { locale: fr }).toUpperCase();
}

/** Day of the month as a plain number string for the DayStrip. */
export function formatDayOfMonth(date: Date): string {
  return dateFnsFormat(date, 'd', { locale: fr });
}
