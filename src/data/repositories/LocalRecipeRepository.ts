import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { map, type Observable } from '@nozbe/watermelondb/utils/rx';

import { assertNonNegative } from '@/domain/validation';
import type { DomainError, Recipe, RecipeIngredient, Result } from '@/domain/types';
import { err, ok } from '@/domain/types/result';

import RecipeModel from '../database/models/Recipe';
import RecipeIngredientModel from '../database/models/RecipeIngredient';
import { optional } from './mapping';
import type { CreateRecipeInput, RecipeRepository, UpdateRecipeInput } from './RecipeRepository';

export function toDomainRecipe(record: RecipeModel): Recipe {
  return {
    id: record.id,
    name: record.name,
    servings: record.servings,
    notes: optional(record.notes),
    isFavorite: record.isFavorite,
    isArchived: record.isArchived,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toDomainRecipeIngredient(record: RecipeIngredientModel): RecipeIngredient {
  return {
    id: record.id,
    recipeId: record.recipeId,
    foodId: record.foodId,
    quantity: record.quantity,
    unit: record.unit,
  };
}

/** Validates every ingredient row's quantity in one pass; returns the first failure, if any. */
function assertIngredientsValid(
  ingredients: { foodId: string; quantity: number; unit: string }[],
): Result<void, DomainError> {
  for (const ingredient of ingredients) {
    const check = assertNonNegative(ingredient.quantity, 'quantity');
    if (!check.ok) return check;
  }
  return ok(undefined);
}

export class LocalRecipeRepository implements RecipeRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Result<Recipe, DomainError>> {
    try {
      const record = await this.database.get<RecipeModel>('recipes').find(id);
      return ok(toDomainRecipe(record));
    } catch {
      return err({ code: 'RECIPE_NOT_FOUND', message: `Recipe ${id} not found` });
    }
  }

  search(query: string): Observable<Recipe[]> {
    // Recipe has no `brand` field (unlike Food), so this only matches on `name`.
    // Decision (SPRINT2-DETAILS.MD): the library list (2c) doesn't show recipe kcal,
    // so this query stays a single-table observe with no ingredient/food join.
    const likeQuery = `%${Q.sanitizeLikeString(query)}%`;
    return this.database
      .get<RecipeModel>('recipes')
      .query(Q.where('name', Q.like(likeQuery)), Q.where('is_archived', false))
      .observe()
      .pipe(map((records) => records.map(toDomainRecipe)));
  }

  async create(input: CreateRecipeInput): Promise<Result<Recipe, DomainError>> {
    const ingredientsCheck = assertIngredientsValid(input.ingredients);
    if (!ingredientsCheck.ok) return ingredientsCheck;

    const ingredientsCollection = this.database.get<RecipeIngredientModel>('recipe_ingredients');

    const created = await this.database.write(async () => {
      const recipe = this.database.get<RecipeModel>('recipes').prepareCreate((row) => {
        row.name = input.name;
        row.servings = input.servings;
        row.notes = input.notes;
        row.isFavorite = input.isFavorite ?? false;
        row.isArchived = false;
      });

      // `recipe.id` is generated client-side by prepareCreate (before the write commits),
      // so it's already available to stamp onto the ingredient rows created in the same batch.
      const ingredientRecords = input.ingredients.map((ingredient) =>
        ingredientsCollection.prepareCreate((row) => {
          row.recipeId = recipe.id;
          row.foodId = ingredient.foodId;
          row.quantity = ingredient.quantity;
          row.unit = ingredient.unit;
        }),
      );

      // Single batch() call: Recipe + all RecipeIngredient rows are written atomically.
      await this.database.batch(recipe, ...ingredientRecords);
      return recipe;
    });

    return ok(toDomainRecipe(created));
  }

  async update(id: string, input: UpdateRecipeInput): Promise<Result<Recipe, DomainError>> {
    if (input.ingredients !== undefined) {
      const ingredientsCheck = assertIngredientsValid(input.ingredients);
      if (!ingredientsCheck.ok) return ingredientsCheck;
    }

    let record: RecipeModel;
    try {
      record = await this.database.get<RecipeModel>('recipes').find(id);
    } catch {
      return err({ code: 'RECIPE_NOT_FOUND', message: `Recipe ${id} not found` });
    }

    const ingredientsCollection = this.database.get<RecipeIngredientModel>('recipe_ingredients');

    const updated = await this.database.write(async () => {
      const operations: (RecipeModel | RecipeIngredientModel)[] = [
        record.prepareUpdate((row) => {
          if (input.name !== undefined) row.name = input.name;
          if (input.servings !== undefined) row.servings = input.servings;
          if (input.notes !== undefined) row.notes = input.notes;
          if (input.isFavorite !== undefined) row.isFavorite = input.isFavorite;
        }),
      ];

      if (input.ingredients !== undefined) {
        // Full replacement rather than diffing: CreateRecipeInput.ingredients carries no
        // per-row id to match against existing RecipeIngredient rows, so the simplest
        // correct approach is to destroy every existing ingredient row and recreate the
        // new list, all inside this same batch() so the swap is atomic. This means editing
        // a single ingredient's quantity still produces a destroy+create pair for that row
        // rather than an in-place update -- WatermelonDB doesn't care either way.
        const existingIngredients = await record.ingredients.fetch();
        operations.push(...existingIngredients.map((row) => row.prepareDestroyPermanently()));
        operations.push(
          ...input.ingredients.map((ingredient) =>
            ingredientsCollection.prepareCreate((row) => {
              row.recipeId = record.id;
              row.foodId = ingredient.foodId;
              row.quantity = ingredient.quantity;
              row.unit = ingredient.unit;
            }),
          ),
        );
      }

      await this.database.batch(...operations);
      return record;
    });

    return ok(toDomainRecipe(updated));
  }

  async archive(id: string): Promise<Result<void, DomainError>> {
    let record: RecipeModel;
    try {
      record = await this.database.get<RecipeModel>('recipes').find(id);
    } catch {
      return err({ code: 'RECIPE_NOT_FOUND', message: `Recipe ${id} not found` });
    }

    await this.database.write(() =>
      record.update((row) => {
        row.isArchived = true;
      }),
    );

    return ok(undefined);
  }

  async delete(id: string): Promise<Result<void, DomainError>> {
    let record: RecipeModel;
    try {
      record = await this.database.get<RecipeModel>('recipes').find(id);
    } catch {
      return err({ code: 'RECIPE_NOT_FOUND', message: `Recipe ${id} not found` });
    }

    await this.database.write(async () => {
      // RecipeIngredient rows are owned by their Recipe (has_many, not shared like Food),
      // so deleting a recipe cascades to its ingredient rows in the same atomic batch.
      const ingredients = await record.ingredients.fetch();
      await this.database.batch(
        record.prepareDestroyPermanently(),
        ...ingredients.map((row) => row.prepareDestroyPermanently()),
      );
    });

    return ok(undefined);
  }

  async findUsagesByFoodId(foodId: string): Promise<RecipeIngredient[]> {
    const records = await this.database
      .get<RecipeIngredientModel>('recipe_ingredients')
      .query(Q.where('food_id', foodId))
      .fetch();
    return records.map(toDomainRecipeIngredient);
  }
}
