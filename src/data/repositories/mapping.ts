import {
  MEAL_TYPES,
  type DiaryEntry,
  type Food,
  type FoodPortion,
  type MealType,
} from '@/domain/types';

import type DiaryEntryModel from '../database/models/DiaryEntry';
import type FoodModel from '../database/models/Food';
import type FoodPortionModel from '../database/models/FoodPortion';

/** WatermelonDB reads an unset optional column back as `null`, while the domain types
 *  declare `T | undefined`. Normalize at the data/domain boundary so no `null` ever
 *  reaches a screen (a raw `null` renders as the string "null" in a TextField). */
export function optional<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

// WatermelonDB stores meal_type as a plain string column; narrow it back to the MealType
// union explicitly via MEAL_TYPES rather than an unchecked `as MealType` cast. Only this
// app's LocalDiaryEntryRepository ever writes this column, so a value outside MEAL_TYPES
// should never occur in practice -- the fallback is a defensive guard against manual DB
// edits or a future schema change, not a case the app itself produces.
function toMealType(value: string): MealType {
  return MEAL_TYPES.find((mealType) => mealType === value) ?? 'SNACK';
}

export function toDomainDiaryEntry(record: DiaryEntryModel): DiaryEntry {
  return {
    id: record.id,
    date: record.date,
    mealType: toMealType(record.mealType),
    // KCAL-152 class of bug: food_id/recipe_id/portion_id are all optional columns that
    // WatermelonDB reads back as `null`, not `undefined` -- go through optional() like
    // every other nullable field on this boundary.
    foodId: optional(record.foodId),
    recipeId: optional(record.recipeId),
    quantity: record.quantity,
    unit: record.unit,
    calories: record.calories,
    protein: record.protein,
    carbs: record.carbs,
    fat: record.fat,
    label: record.label,
    portionId: optional(record.portionId),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toDomainFoodPortion(record: FoodPortionModel): FoodPortion {
  return {
    id: record.id,
    foodId: record.foodId,
    label: record.label,
    quantity: record.quantity,
    unit: record.unit,
    position: record.position,
  };
}

/**
 * Shared Food mapper used by both LocalFoodRepository and getRecipeWithIngredients so the
 * `optional()` normalization applies to every read path, not just half of them.
 *
 * `portions` defaults to `[]`: per KCAL-163b, `search()` deliberately doesn't load them (it
 * would stack a second N+1 on top of the one KCAL-158 already solved for recipe calories) --
 * only callers that actually need portion data (`findById`, the RecipeFormScreen edit-mode
 * load) fetch and pass them in explicitly.
 *
 * `Food.servingQuantity`/`servingUnit` (the model's deprecated columns, see models/Food.ts)
 * are intentionally NOT mapped here -- application code must never read them again.
 */
export function toDomainFood(record: FoodModel, portions: FoodPortion[] = []): Food {
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
    category: optional(record.category),
    barcode: optional(record.barcode),
    source: optional(record.source),
    isFavorite: record.isFavorite,
    isArchived: record.isArchived,
    portions,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
