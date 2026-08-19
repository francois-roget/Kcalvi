import type { Database } from '@nozbe/watermelondb';
import type { Observable } from '@nozbe/watermelondb/utils/rx';

import { createTestDatabase } from '../database/createTestDatabase';
import RecipeIngredientModel from '../database/models/RecipeIngredient';
import type { CreateRecipeInput } from './RecipeRepository';
import { LocalRecipeRepository } from './LocalRecipeRepository';

// The `recipe_ingredients` table (schema.ts) stores `food_id` as a plain unindexed-FK
// string with no SQLite foreign key constraint, so these fixtures don't need matching
// rows in the `foods` table -- any string id exercises the recipe-side logic under test.
const VALID_RECIPE_INPUT: CreateRecipeInput = {
  name: 'Salade de riz',
  servings: 4,
  notes: 'Pour le repas de midi',
  ingredients: [
    { foodId: 'food-rice', quantity: 200, unit: 'g' },
    { foodId: 'food-tomato', quantity: 150, unit: 'g' },
  ],
};

function collectEmissions<T>(observable: Observable<T>, count: number): Promise<T[]> {
  return new Promise((resolve) => {
    const values: T[] = [];
    // Declared before `.subscribe()` returns: WatermelonDB's Query.observe()
    // emits its first value synchronously, so when `count` is 1 the callback
    // below can run before the `subscribe()` call itself returns — reading a
    // `const subscription` assigned from that same call would still be TDZ/undefined.
    let subscription: { unsubscribe: () => void } | undefined;
    subscription = observable.subscribe((value) => {
      values.push(value);
      if (values.length === count) {
        subscription?.unsubscribe();
        resolve(values);
      }
    });
  });
}

// Subscribes after the writes have already settled, so the first emission
// already reflects the current DB state (Query.observe() emits synchronously
// on subscribe) — no need to wait for a second emission.
async function searchOnce(repository: LocalRecipeRepository, query: string) {
  const [result] = await collectEmissions(repository.search(query), 1);
  return result;
}

async function fetchIngredientRows(database: Database, recipeId: string) {
  return database
    .get<RecipeIngredientModel>('recipe_ingredients')
    .query()
    .fetch()
    .then((rows) => rows.filter((row) => row.recipeId === recipeId));
}

describe('LocalRecipeRepository (real SQLite via better-sqlite3)', () => {
  let database: Database;
  let repository: LocalRecipeRepository;

  beforeEach(() => {
    database = createTestDatabase();
    repository = new LocalRecipeRepository(database);
  });

  describe('create', () => {
    it('creates a recipe with multiple ingredients atomically', async () => {
      const result = await repository.create(VALID_RECIPE_INPUT);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.id).toBeTruthy();
      expect(result.value.name).toBe('Salade de riz');
      expect(result.value.servings).toBe(4);
      expect(result.value.notes).toBe('Pour le repas de midi');
      expect(result.value.isFavorite).toBe(false);

      const ingredientRows = await fetchIngredientRows(database, result.value.id);
      expect(ingredientRows).toHaveLength(2);
      expect(ingredientRows.map((row) => ({ foodId: row.foodId, quantity: row.quantity }))).toEqual(
        expect.arrayContaining([
          { foodId: 'food-rice', quantity: 200 },
          { foodId: 'food-tomato', quantity: 150 },
        ]),
      );
    });

    it('accepts an explicit isFavorite value on create', async () => {
      const result = await repository.create({ ...VALID_RECIPE_INPUT, isFavorite: true });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.isFavorite).toBe(true);
    });

    it('creates a recipe with 0 ingredients', async () => {
      const result = await repository.create({ ...VALID_RECIPE_INPUT, ingredients: [] });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const ingredientRows = await fetchIngredientRows(database, result.value.id);
      expect(ingredientRows).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('adds an ingredient, removes one, and changes a quantity in a single atomic write', async () => {
      const created = await repository.create(VALID_RECIPE_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      // Starting set: [food-rice qty 200, food-tomato qty 150].
      // Requested final set: food-rice's quantity changes, food-tomato is dropped,
      // food-cheese is newly added.
      const updated = await repository.update(created.value.id, {
        ingredients: [
          { foodId: 'food-rice', quantity: 250, unit: 'g' },
          { foodId: 'food-cheese', quantity: 50, unit: 'g' },
        ],
      });

      expect(updated.ok).toBe(true);
      if (!updated.ok) return;

      const ingredientRows = await fetchIngredientRows(database, created.value.id);
      // The final set matches exactly what was requested -- no leftover row from the
      // old set (food-tomato) and no duplicate/stale row for food-rice.
      expect(ingredientRows).toHaveLength(2);
      expect(
        ingredientRows
          .map((row) => ({ foodId: row.foodId, quantity: row.quantity }))
          .sort((a, b) => a.foodId.localeCompare(b.foodId)),
      ).toEqual([
        { foodId: 'food-cheese', quantity: 50 },
        { foodId: 'food-rice', quantity: 250 },
      ]);
    });

    it('updates recipe fields without touching ingredients when ingredients is omitted', async () => {
      const created = await repository.create(VALID_RECIPE_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const updated = await repository.update(created.value.id, { name: 'Salade de riz (v2)' });

      expect(updated.ok).toBe(true);
      if (!updated.ok) return;
      expect(updated.value.name).toBe('Salade de riz (v2)');
      // Untouched field preserved.
      expect(updated.value.servings).toBe(4);

      const ingredientRows = await fetchIngredientRows(database, created.value.id);
      expect(ingredientRows).toHaveLength(2);
    });

    it('replaces all ingredients with an empty list when ingredients: [] is passed', async () => {
      const created = await repository.create(VALID_RECIPE_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const updated = await repository.update(created.value.id, { ingredients: [] });

      expect(updated.ok).toBe(true);
      if (!updated.ok) return;

      const ingredientRows = await fetchIngredientRows(database, created.value.id);
      expect(ingredientRows).toHaveLength(0);
    });

    it('returns RECIPE_NOT_FOUND for a nonexistent id', async () => {
      const result = await repository.update('nonexistent-id', { name: 'X' });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('RECIPE_NOT_FOUND');
    });
  });

  describe('archive', () => {
    it('returns RECIPE_ARCHIVE_NOT_SUPPORTED for an existing recipe (no is_archived column yet)', async () => {
      const created = await repository.create(VALID_RECIPE_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const result = await repository.archive(created.value.id);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('RECIPE_ARCHIVE_NOT_SUPPORTED');

      // The record itself is untouched by the (rejected) archive attempt.
      const record = await database.get('recipes').find(created.value.id);
      expect(record).toBeTruthy();
    });

    it('returns RECIPE_NOT_FOUND for a nonexistent id, checked before the not-supported error', async () => {
      const result = await repository.archive('nonexistent-id');

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('RECIPE_NOT_FOUND');
    });
  });

  describe('delete', () => {
    it('removes the recipe and cascades to its ingredient rows atomically', async () => {
      const created = await repository.create(VALID_RECIPE_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const deleted = await repository.delete(created.value.id);
      expect(deleted.ok).toBe(true);

      const findResult = await repository.findById(created.value.id);
      expect(findResult.ok).toBe(false);
      if (findResult.ok) return;
      expect(findResult.error.code).toBe('RECIPE_NOT_FOUND');

      const recipeCount = await database.get('recipes').query().fetchCount();
      expect(recipeCount).toBe(0);
      const ingredientCount = await database.get('recipe_ingredients').query().fetchCount();
      expect(ingredientCount).toBe(0);
    });

    it('returns RECIPE_NOT_FOUND for a nonexistent id', async () => {
      const result = await repository.delete('nonexistent-id');

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('RECIPE_NOT_FOUND');
    });
  });

  describe('assertNonNegative on ingredient quantity (RM14)', () => {
    it('rejects a negative ingredient quantity on create, writing nothing', async () => {
      const result = await repository.create({
        ...VALID_RECIPE_INPUT,
        ingredients: [
          { foodId: 'food-rice', quantity: 200, unit: 'g' },
          { foodId: 'food-tomato', quantity: -1, unit: 'g' },
        ],
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('NEGATIVE_VALUE');

      const recipeCount = await database.get('recipes').query().fetchCount();
      expect(recipeCount).toBe(0);
      const ingredientCount = await database.get('recipe_ingredients').query().fetchCount();
      expect(ingredientCount).toBe(0);
    });

    it('rejects a negative ingredient quantity on update, leaving the original ingredients untouched', async () => {
      const created = await repository.create(VALID_RECIPE_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const result = await repository.update(created.value.id, {
        ingredients: [{ foodId: 'food-rice', quantity: -5, unit: 'g' }],
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('NEGATIVE_VALUE');

      const ingredientRows = await fetchIngredientRows(database, created.value.id);
      expect(ingredientRows).toHaveLength(2);
    });

    it('accepts an ingredient quantity of exactly 0 (0 is not negative)', async () => {
      const result = await repository.create({
        ...VALID_RECIPE_INPUT,
        ingredients: [{ foodId: 'food-rice', quantity: 0, unit: 'g' }],
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const ingredientRows = await fetchIngredientRows(database, result.value.id);
      expect(ingredientRows).toHaveLength(1);
      expect(ingredientRows[0]?.quantity).toBe(0);
    });
  });

  describe('search()', () => {
    it('finds a recipe by name', async () => {
      const rice = await repository.create(VALID_RECIPE_INPUT);
      expect(rice.ok).toBe(true);
      if (!rice.ok) return;
      const other = await repository.create({ ...VALID_RECIPE_INPUT, name: 'Soupe de courgettes' });
      expect(other.ok).toBe(true);
      if (!other.ok) return;

      const results = await searchOnce(repository, 'riz');

      expect(results.map((recipe) => recipe.id)).toEqual([rice.value.id]);
    });

    it('returns all recipes for an empty query', async () => {
      const first = await repository.create(VALID_RECIPE_INPUT);
      expect(first.ok).toBe(true);
      if (!first.ok) return;
      const second = await repository.create({
        ...VALID_RECIPE_INPUT,
        name: 'Soupe de courgettes',
      });
      expect(second.ok).toBe(true);
      if (!second.ok) return;

      const results = await searchOnce(repository, '');

      expect(results.map((recipe) => recipe.id).sort()).toEqual(
        [first.value.id, second.value.id].sort(),
      );
    });
  });

  describe('findUsagesByFoodId', () => {
    it('returns only the ingredient rows referencing the given food, across recipes', async () => {
      const recipeA = await repository.create(VALID_RECIPE_INPUT);
      expect(recipeA.ok).toBe(true);
      if (!recipeA.ok) return;
      const recipeB = await repository.create({
        ...VALID_RECIPE_INPUT,
        name: 'Riz cantonais',
        ingredients: [{ foodId: 'food-rice', quantity: 100, unit: 'g' }],
      });
      expect(recipeB.ok).toBe(true);
      if (!recipeB.ok) return;

      const usages = await repository.findUsagesByFoodId('food-rice');

      expect(usages.map((usage) => usage.recipeId).sort()).toEqual(
        [recipeA.value.id, recipeB.value.id].sort(),
      );
      expect(usages.every((usage) => usage.foodId === 'food-rice')).toBe(true);
    });

    it('returns an empty array when the food is not used in any recipe', async () => {
      const created = await repository.create(VALID_RECIPE_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const usages = await repository.findUsagesByFoodId('food-never-used');

      expect(usages).toEqual([]);
    });
  });
});
