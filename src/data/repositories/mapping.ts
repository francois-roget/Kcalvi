import type { Food } from '@/domain/types';

import type FoodModel from '../database/models/Food';

/** WatermelonDB reads an unset optional column back as `null`, while the domain types
 *  declare `T | undefined`. Normalize at the data/domain boundary so no `null` ever
 *  reaches a screen (a raw `null` renders as the string "null" in a TextField). */
export function optional<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

/** Shared Food mapper used by both LocalFoodRepository and getRecipeWithIngredients so the
 *  `optional()` normalization applies to every read path, not just half of them. */
export function toDomainFood(record: FoodModel): Food {
  return {
    id: record.id,
    name: record.name,
    brand: optional(record.brand),
    calories: record.calories,
    protein: record.protein,
    carbs: record.carbs,
    fat: record.fat,
    fiber: optional(record.fiber),
    sugar: optional(record.sugar),
    referenceQuantity: record.referenceQuantity,
    referenceUnit: record.referenceUnit,
    servingQuantity: optional(record.servingQuantity),
    servingUnit: optional(record.servingUnit),
    category: optional(record.category),
    barcode: optional(record.barcode),
    source: optional(record.source),
    isFavorite: record.isFavorite,
    isArchived: record.isArchived,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
