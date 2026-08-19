/// <reference types="node" />
// This file runs under the "DB" jest project (testEnvironment: 'node', see jest.config.js),
// which is the only place in the codebase that touches the real filesystem (to reopen an
// on-disk SQLite file across two adapters below). The root tsconfig.json intentionally scopes
// `compilerOptions.types` to `["jest"]` so Node globals don't leak into React Native app code;
// this explicit reference pulls in @types/node for this file only, without changing that.
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import type { Observable } from '@nozbe/watermelondb/utils/rx';
import { appSchema, tableSchema } from '@nozbe/watermelondb';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { createTestDatabase } from '../database/createTestDatabase';
import { migrations } from '../database/migrations';
import { modelClasses } from '../database/models';
import RecipeModel from '../database/models/Recipe';
import RecipeIngredientModel from '../database/models/RecipeIngredient';
import { schema } from '../database/schema';
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
    it('sets is_archived on the record without touching its recipe_ingredients rows', async () => {
      const created = await repository.create(VALID_RECIPE_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const result = await repository.archive(created.value.id);

      expect(result.ok).toBe(true);

      const record = await database.get<RecipeModel>('recipes').find(created.value.id);
      expect(record.isArchived).toBe(true);

      // Archiving is a soft flag on the recipe row -- its ingredients must survive untouched.
      const ingredientRows = await fetchIngredientRows(database, created.value.id);
      expect(ingredientRows).toHaveLength(2);
    });

    it('returns RECIPE_NOT_FOUND for a nonexistent id', async () => {
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

    it('excludes archived recipes', async () => {
      const kept = await repository.create(VALID_RECIPE_INPUT);
      expect(kept.ok).toBe(true);
      if (!kept.ok) return;
      const archived = await repository.create({
        ...VALID_RECIPE_INPUT,
        name: 'Soupe de courgettes',
      });
      expect(archived.ok).toBe(true);
      if (!archived.ok) return;

      const archiveResult = await repository.archive(archived.value.id);
      expect(archiveResult.ok).toBe(true);

      const results = await searchOnce(repository, '');

      expect(results.map((recipe) => recipe.id)).toEqual([kept.value.id]);
    });
  });

  describe('findById', () => {
    // Sprint 3's diary feature reads a recipe by id even after it's been archived
    // (an archived recipe stays usable from the diary, it only leaves the library list).
    it('still finds an archived recipe', async () => {
      const created = await repository.create(VALID_RECIPE_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const archiveResult = await repository.archive(created.value.id);
      expect(archiveResult.ok).toBe(true);

      const found = await repository.findById(created.value.id);

      expect(found.ok).toBe(true);
      if (!found.ok) return;
      expect(found.value.id).toBe(created.value.id);
      expect(found.value.isArchived).toBe(true);
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

describe('recipes migration v3 -> v4 (is_archived backfill)', () => {
  // Mirrors schema.ts as it existed before this ticket (schema version 3): the `recipes`
  // table has no `is_archived` column yet. Every table used by `modelClasses` must be
  // present here too (CollectionMap validates static table <-> schema table pairing at
  // Database construction), so this otherwise-unused fixture repeats the rest of the
  // pre-ticket schema verbatim, not just the `recipes` table under test.
  //
  // `food_portions` (KCAL-163) is deliberately NOT in this v3 fixture -- it postdates
  // schema v3 entirely, so `v3ModelClasses` below excludes FoodPortion to match (adding an
  // empty `food_portions` table here just to satisfy CollectionMap would make the v4->v5
  // migration step below fail with "table already exists" when it tries to create it).
  const v3ModelClasses = modelClasses.filter((modelClass) => modelClass.table !== 'food_portions');

  const schemaV3 = appSchema({
    version: 3,
    tables: [
      tableSchema({
        name: 'user_profiles',
        columns: [
          { name: 'name', type: 'string' },
          { name: 'daily_calorie_goal', type: 'number' },
          { name: 'protein_goal', type: 'number' },
          { name: 'carb_goal', type: 'number' },
          { name: 'fat_goal', type: 'number' },
          { name: 'start_weight', type: 'number' },
          { name: 'current_weight', type: 'number' },
          { name: 'target_weight', type: 'number' },
          { name: 'sex', type: 'string' },
          { name: 'age', type: 'number' },
          { name: 'height', type: 'number' },
          { name: 'activity_level', type: 'string' },
          { name: 'singleton', type: 'number' },
          { name: 'created_at', type: 'number' },
          { name: 'updated_at', type: 'number' },
        ],
      }),
      tableSchema({
        name: 'foods',
        columns: [
          { name: 'name', type: 'string' },
          { name: 'brand', type: 'string', isOptional: true },
          { name: 'calories', type: 'number' },
          { name: 'protein', type: 'number' },
          { name: 'carbs', type: 'number' },
          { name: 'fat', type: 'number' },
          { name: 'fiber', type: 'number', isOptional: true },
          { name: 'sugar', type: 'number', isOptional: true },
          { name: 'reference_quantity', type: 'number' },
          { name: 'reference_unit', type: 'string' },
          { name: 'serving_quantity', type: 'number', isOptional: true },
          { name: 'serving_unit', type: 'string', isOptional: true },
          { name: 'category', type: 'string', isOptional: true },
          { name: 'barcode', type: 'string', isOptional: true },
          { name: 'source', type: 'string', isOptional: true },
          { name: 'is_favorite', type: 'boolean' },
          { name: 'is_archived', type: 'boolean' },
          { name: 'created_at', type: 'number' },
          { name: 'updated_at', type: 'number' },
        ],
      }),
      tableSchema({
        name: 'recipes',
        columns: [
          { name: 'name', type: 'string' },
          { name: 'servings', type: 'number' },
          { name: 'notes', type: 'string', isOptional: true },
          { name: 'is_favorite', type: 'boolean' },
          { name: 'created_at', type: 'number' },
          { name: 'updated_at', type: 'number' },
        ],
      }),
      tableSchema({
        name: 'recipe_ingredients',
        columns: [
          { name: 'recipe_id', type: 'string', isIndexed: true },
          { name: 'food_id', type: 'string', isIndexed: true },
          { name: 'quantity', type: 'number' },
          { name: 'unit', type: 'string' },
        ],
      }),
      tableSchema({
        name: 'diary_entries',
        columns: [
          { name: 'date', type: 'number', isIndexed: true },
          { name: 'meal_type', type: 'string' },
          { name: 'food_id', type: 'string', isOptional: true, isIndexed: true },
          { name: 'recipe_id', type: 'string', isOptional: true, isIndexed: true },
          { name: 'quantity', type: 'number' },
          { name: 'unit', type: 'string' },
          { name: 'calories', type: 'number' },
          { name: 'protein', type: 'number' },
          { name: 'carbs', type: 'number' },
          { name: 'fat', type: 'number' },
          { name: 'created_at', type: 'number' },
        ],
      }),
      tableSchema({
        name: 'activity_entries',
        columns: [
          { name: 'date', type: 'number', isIndexed: true },
          { name: 'name', type: 'string' },
          { name: 'duration', type: 'number' },
          { name: 'calories_burned', type: 'number' },
          { name: 'notes', type: 'string', isOptional: true },
        ],
      }),
      tableSchema({
        name: 'weight_entries',
        columns: [
          { name: 'date', type: 'number', isIndexed: true },
          { name: 'weight', type: 'number' },
          { name: 'notes', type: 'string', isOptional: true },
        ],
      }),
      tableSchema({
        name: 'badges',
        columns: [
          { name: 'type', type: 'string' },
          { name: 'earned_date', type: 'number' },
          { name: 'period_start', type: 'number' },
          { name: 'period_end', type: 'number' },
        ],
      }),
    ],
  });

  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(
      os.tmpdir(),
      `kcalvi-recipes-migration-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`,
    );
  });

  afterEach(() => {
    // The SQLite adapters opened below are never explicitly closed (WatermelonDB's
    // Node SQLite adapter exposes no public close()), so just remove the on-disk
    // files -- an open file descriptor doesn't stop unlink on macOS/Linux.
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(dbPath + suffix);
      } catch {
        // Sidecar file may not exist -- nothing to clean up.
      }
    }
  });

  it('keeps every pre-existing recipe visible via search() after upgrading a populated v3 database to v4', async () => {
    // Step 1: a fresh v3-only install (no `migrations` passed -- this is
    // `setUpWithSchema`, not a migration), with two recipes created exactly as
    // Sprint 2's LocalRecipeRepository.create() would have, minus `is_archived`
    // since that column doesn't exist yet at this schema version.
    const v3Adapter = new SQLiteAdapter({ dbName: dbPath, schema: schemaV3 });
    const v3Database = new Database({ adapter: v3Adapter, modelClasses: v3ModelClasses });

    const recipeIds = await v3Database.write(async () => {
      const collection = v3Database.get<RecipeModel>('recipes');
      const first = await collection.create((row) => {
        row.name = 'Salade de riz';
        row.servings = 4;
        row.isFavorite = false;
      });
      const second = await collection.create((row) => {
        row.name = 'Soupe de courgettes';
        row.servings = 2;
        row.isFavorite = true;
      });
      return [first.id, second.id];
    });

    // Step 2: reopen the same on-disk file with the current (v4) schema and
    // migrations. The file's stored PRAGMA user_version is still 3, so the adapter
    // runs schemaMigrations, which is what actually exercises the toVersion: 4 step
    // (addColumns + the NULL -> false backfill), not just a fresh v4 install.
    const v4Adapter = new SQLiteAdapter({ dbName: dbPath, schema, migrations });
    const v4Database = new Database({ adapter: v4Adapter, modelClasses });
    const repository = new LocalRecipeRepository(v4Database);

    // Without the mandatory backfill step, both rows would read is_archived = null
    // and Q.where('is_archived', false) (used by search()) would match neither --
    // this assertion is exactly the "all existing recipes disappear" regression
    // the ticket calls out.
    const results = await searchOnce(repository, '');
    expect(results.map((recipe) => recipe.id).sort()).toEqual([...recipeIds].sort());
    expect(results.every((recipe) => recipe.isArchived === false)).toBe(true);

    // findById also reflects the backfilled value, not null/undefined.
    const found = await repository.findById(recipeIds[0] as string);
    expect(found.ok).toBe(true);
    if (!found.ok) return;
    expect(found.value.isArchived).toBe(false);
  });
});
