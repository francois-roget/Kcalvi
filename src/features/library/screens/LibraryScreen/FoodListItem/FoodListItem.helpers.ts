import type { Food } from '@/domain/types';
import { formatInteger, unitLabel } from '@/utils/format';

// Kept minimal on purpose: the real i18next `TFunction` type is generic over namespaces/keys,
// which isn't needed here -- this only ever calls `t(key, options)`.
type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * French kcal label for a food card (KCAL-158): "64 kcal pour 100 g" / "24 kcal pour 100 ml" /
 * "78 kcal par unité" -- never "78 kcal pour 1 unité": a `referenceUnit === 'unit'` food always
 * has `referenceQuantity = 1`, so the "pour N unité" phrasing would read oddly.
 */
export function foodKcalLabel(t: TFunction, food: Food): string {
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
