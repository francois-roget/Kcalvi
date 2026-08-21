import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { map, type Observable } from '@nozbe/watermelondb/utils/rx';

import { assertNonNegative, checkFoodDeletable } from '@/domain/validation';
import type { DomainError, Food, Result } from '@/domain/types';
import { err, ok } from '@/domain/types/result';

import FoodModel from '../database/models/Food';
import FoodPortionModel from '../database/models/FoodPortion';
import RecipeIngredientModel from '../database/models/RecipeIngredient';
import type { CreateFoodInput, FoodRepository, UpdateFoodInput } from './FoodRepository';
import { toDomainFood, toDomainFoodPortion } from './mapping';

async function fetchOrderedPortions(record: FoodModel): Promise<FoodPortionModel[]> {
  return record.portions.extend(Q.sortBy('position', Q.asc)).fetch();
}

export class LocalFoodRepository implements FoodRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Result<Food, DomainError>> {
    try {
      const record = await this.database.get<FoodModel>('foods').find(id);
      const portions = await fetchOrderedPortions(record);
      return ok(toDomainFood(record, portions.map(toDomainFoodPortion)));
    } catch {
      return err({ code: 'FOOD_NOT_FOUND', message: `Food ${id} not found` });
    }
  }

  search(query: string): Observable<Food[]> {
    // F12: matches on name OR brand (Food.brand -> `brand` column, optional string).
    // An empty query still yields the `%%` wildcard for both fields, so an empty
    // search keeps returning every non-archived food, unchanged from before.
    // KCAL-163b: deliberately doesn't load `portions` here (toDomainFood defaults to `[]`) --
    // the library list doesn't need them, and it would stack a second N+1 on top of the one
    // KCAL-158 already solved for recipe calories.
    const likeQuery = `%${Q.sanitizeLikeString(query)}%`;
    return this.database
      .get<FoodModel>('foods')
      .query(
        Q.or(Q.where('name', Q.like(likeQuery)), Q.where('brand', Q.like(likeQuery))),
        Q.where('is_archived', false),
      )
      .observe()
      .pipe(map((records) => records.map((record) => toDomainFood(record))));
  }

  async create(input: CreateFoodInput): Promise<Result<Food, DomainError>> {
    const caloriesCheck = assertNonNegative(input.calories, 'calories');
    if (!caloriesCheck.ok) return caloriesCheck;

    const portionsCollection = this.database.get<FoodPortionModel>('food_portions');
    const portionInputs = input.portions ?? [];

    const created = await this.database.write(async () => {
      const food = this.database.get<FoodModel>('foods').prepareCreate((row) => {
        row.name = input.name;
        row.brand = input.brand;
        row.calories = input.calories;
        row.protein = input.protein;
        row.carbs = input.carbs;
        row.fat = input.fat;
        row.fiber = input.fiber;
        row.sugar = input.sugar;
        row.referenceQuantity = input.referenceQuantity;
        row.referenceUnit = input.referenceUnit;
        row.category = input.category;
        row.barcode = input.barcode;
        row.source = input.source;
        row.isFavorite = input.isFavorite ?? false;
        row.isArchived = input.isArchived ?? false;
      });

      // `food.id` is generated client-side by prepareCreate (before the write commits), so
      // it's already available to stamp onto the portion rows created in the same batch --
      // same pattern as LocalRecipeRepository.create with its RecipeIngredient rows.
      const portionRecords = portionInputs.map((portion) =>
        portionsCollection.prepareCreate((row) => {
          row.foodId = food.id;
          row.label = portion.label;
          row.quantity = portion.quantity;
          row.unit = portion.unit;
          row.position = portion.position;
        }),
      );

      // Single batch() call: Food + all FoodPortion rows are written atomically.
      await this.database.batch(food, ...portionRecords);
      return food;
    });

    const portions = await fetchOrderedPortions(created);
    return ok(toDomainFood(created, portions.map(toDomainFoodPortion)));
  }

  async update(id: string, input: UpdateFoodInput): Promise<Result<Food, DomainError>> {
    if (input.calories !== undefined) {
      const caloriesCheck = assertNonNegative(input.calories, 'calories');
      if (!caloriesCheck.ok) return caloriesCheck;
    }

    const record = await this.database.get<FoodModel>('foods').find(id);
    const portionsCollection = this.database.get<FoodPortionModel>('food_portions');

    const updated = await this.database.write(async () => {
      const operations: (FoodModel | FoodPortionModel)[] = [
        record.prepareUpdate((food) => {
          if (input.name !== undefined) food.name = input.name;
          if (input.brand !== undefined) food.brand = input.brand;
          if (input.calories !== undefined) food.calories = input.calories;
          if (input.protein !== undefined) food.protein = input.protein;
          if (input.carbs !== undefined) food.carbs = input.carbs;
          if (input.fat !== undefined) food.fat = input.fat;
          if (input.fiber !== undefined) food.fiber = input.fiber;
          if (input.sugar !== undefined) food.sugar = input.sugar;
          if (input.referenceQuantity !== undefined) {
            food.referenceQuantity = input.referenceQuantity;
          }
          if (input.referenceUnit !== undefined) food.referenceUnit = input.referenceUnit;
          if (input.category !== undefined) food.category = input.category;
          if (input.barcode !== undefined) food.barcode = input.barcode;
          if (input.source !== undefined) food.source = input.source;
          if (input.isFavorite !== undefined) food.isFavorite = input.isFavorite;
          if (input.isArchived !== undefined) food.isArchived = input.isArchived;
        }),
      ];

      if (input.portions !== undefined) {
        // Full replacement rather than diffing -- same rationale as
        // LocalRecipeRepository.update's ingredient handling: destroy every existing
        // portion row and recreate the new list, all inside this same batch() so the swap
        // is atomic.
        const existingPortions = await record.portions.fetch();
        operations.push(...existingPortions.map((row) => row.prepareDestroyPermanently()));
        operations.push(
          ...input.portions.map((portion) =>
            portionsCollection.prepareCreate((row) => {
              row.foodId = record.id;
              row.label = portion.label;
              row.quantity = portion.quantity;
              row.unit = portion.unit;
              row.position = portion.position;
            }),
          ),
        );
      }

      await this.database.batch(...operations);
      return record;
    });

    const portions = await fetchOrderedPortions(updated);
    return ok(toDomainFood(updated, portions.map(toDomainFoodPortion)));
  }

  async archive(id: string): Promise<Result<void, DomainError>> {
    const record = await this.database.get<FoodModel>('foods').find(id);
    await this.database.write(() =>
      record.update((food) => {
        food.isArchived = true;
      }),
    );
    return ok(undefined);
  }

  async delete(id: string): Promise<Result<void, DomainError>> {
    const usages = await this.database
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

    const record = await this.database.get<FoodModel>('foods').find(id);
    await this.database.write(async () => {
      // food_portions rows are owned by their Food (has_many, not a shared reference like
      // RecipeIngredient.food_id), so deleting a food cascades to its portion rows in the
      // same atomic batch -- same pattern as LocalRecipeRepository.delete with ingredients.
      const portions = await record.portions.fetch();
      await this.database.batch(
        record.prepareDestroyPermanently(),
        ...portions.map((row) => row.prepareDestroyPermanently()),
      );
    });
    return ok(undefined);
  }
}
