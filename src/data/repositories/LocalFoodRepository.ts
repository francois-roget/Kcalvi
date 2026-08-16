import { Q } from '@nozbe/watermelondb';

import { assertNonNegative, checkFoodDeletable } from '@/domain/validation';
import type { DomainError, Food, Result } from '@/domain/types';
import { err, ok } from '@/domain/types/result';

import { database } from '../database';
import FoodModel from '../database/models/Food';
import RecipeIngredientModel from '../database/models/RecipeIngredient';
import type { CreateFoodInput, FoodRepository, UpdateFoodInput } from './FoodRepository';

function toDomainFood(record: FoodModel): Food {
  return {
    id: record.id,
    name: record.name,
    brand: record.brand,
    calories: record.calories,
    protein: record.protein,
    carbs: record.carbs,
    fat: record.fat,
    fiber: record.fiber,
    sugar: record.sugar,
    referenceQuantity: record.referenceQuantity,
    referenceUnit: record.referenceUnit,
    servingQuantity: record.servingQuantity,
    servingUnit: record.servingUnit,
    category: record.category,
    barcode: record.barcode,
    source: record.source,
    isFavorite: record.isFavorite,
    isArchived: record.isArchived,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class LocalFoodRepository implements FoodRepository {
  async findById(id: string): Promise<Result<Food, DomainError>> {
    try {
      const record = await database.get<FoodModel>('foods').find(id);
      return ok(toDomainFood(record));
    } catch {
      return err({ code: 'FOOD_NOT_FOUND', message: `Aliment ${id} introuvable` });
    }
  }

  async search(query: string): Promise<Food[]> {
    const records = await database
      .get<FoodModel>('foods')
      .query(
        Q.where('name', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
        Q.where('is_archived', false),
      )
      .fetch();
    return records.map(toDomainFood);
  }

  async create(input: CreateFoodInput): Promise<Result<Food, DomainError>> {
    const caloriesCheck = assertNonNegative(input.calories, 'calories');
    if (!caloriesCheck.ok) return caloriesCheck;

    const record = await database.write(() =>
      database.get<FoodModel>('foods').create((food) => {
        food.name = input.name;
        food.brand = input.brand;
        food.calories = input.calories;
        food.protein = input.protein;
        food.carbs = input.carbs;
        food.fat = input.fat;
        food.fiber = input.fiber;
        food.sugar = input.sugar;
        food.referenceQuantity = input.referenceQuantity;
        food.referenceUnit = input.referenceUnit;
        food.servingQuantity = input.servingQuantity;
        food.servingUnit = input.servingUnit;
        food.category = input.category;
        food.barcode = input.barcode;
        food.source = input.source;
        food.isFavorite = input.isFavorite ?? false;
        food.isArchived = input.isArchived ?? false;
      }),
    );

    return ok(toDomainFood(record));
  }

  async update(id: string, input: UpdateFoodInput): Promise<Result<Food, DomainError>> {
    if (input.calories !== undefined) {
      const caloriesCheck = assertNonNegative(input.calories, 'calories');
      if (!caloriesCheck.ok) return caloriesCheck;
    }

    const record = await database.get<FoodModel>('foods').find(id);
    const updated = await database.write(() =>
      record.update((food) => {
        Object.assign(food, input);
      }),
    );

    return ok(toDomainFood(updated));
  }

  async archive(id: string): Promise<Result<void, DomainError>> {
    const record = await database.get<FoodModel>('foods').find(id);
    await database.write(() =>
      record.update((food) => {
        food.isArchived = true;
      }),
    );
    return ok(undefined);
  }

  async delete(id: string): Promise<Result<void, DomainError>> {
    const usages = await database
      .get<RecipeIngredientModel>('recipe_ingredients')
      .query(Q.where('food_id', id))
      .fetch();

    const deletable = checkFoodDeletable(
      id,
      usages.map((usage) => ({
        id: usage.id,
        recipeId: usage.recipeId,
        foodId: usage.foodId,
        quantity: usage.quantity,
        unit: usage.unit,
      })),
    );
    if (!deletable.ok) return deletable;

    const record = await database.get<FoodModel>('foods').find(id);
    await database.write(() => record.destroyPermanently());
    return ok(undefined);
  }
}
