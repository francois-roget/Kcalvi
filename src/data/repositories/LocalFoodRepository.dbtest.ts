/// <reference types="node" />
// The migration describe block below reopens an on-disk SQLite file across two adapters,
// which needs the real filesystem -- this file runs under the "DB" jest project
// (testEnvironment: 'node', see jest.config.js and LocalRecipeRepository.dbtest.ts's
// identical header comment for the full rationale).
import { Database, appSchema, tableSchema } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import type { Observable } from '@nozbe/watermelondb/utils/rx';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { createTestDatabase } from '../database/createTestDatabase';
import { migrations } from '../database/migrations';
import { modelClasses } from '../database/models';
import FoodModel from '../database/models/Food';
import FoodPortionModel from '../database/models/FoodPortion';
import { schema } from '../database/schema';
import type { CreateFoodInput } from './FoodRepository';
import { LocalFoodRepository } from './LocalFoodRepository';

const VALID_FOOD_INPUT: CreateFoodInput = {
  name: 'Poulet (blanc, cru)',
  brand: 'Delhaize',
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  referenceQuantity: 100,
  referenceUnit: 'g',
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
async function searchOnce(repository: LocalFoodRepository, query: string) {
  const [result] = await collectEmissions(repository.search(query), 1);
  return result;
}

describe('LocalFoodRepository (real SQLite via better-sqlite3)', () => {
  let database: Database;
  let repository: LocalFoodRepository;

  beforeEach(() => {
    database = createTestDatabase();
    repository = new LocalFoodRepository(database);
  });

  it('creates a food and returns the persisted domain object', async () => {
    const result = await repository.create(VALID_FOOD_INPUT);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBeTruthy();
    expect(result.value.name).toBe('Poulet (blanc, cru)');
    expect(result.value.brand).toBe('Delhaize');
    expect(result.value.calories).toBe(165);
    expect(result.value.isFavorite).toBe(false);
    expect(result.value.isArchived).toBe(false);
  });

  it('updates a food and returns the updated domain object', async () => {
    const created = await repository.create(VALID_FOOD_INPUT);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await repository.update(created.value.id, {
      calories: 200,
      isFavorite: true,
    });

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.calories).toBe(200);
    expect(updated.value.isFavorite).toBe(true);
    // Untouched fields are preserved.
    expect(updated.value.name).toBe('Poulet (blanc, cru)');
  });

  it('archives a food instead of removing it, excluding it from search() default results', async () => {
    const created = await repository.create(VALID_FOOD_INPUT);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const other = await repository.create({ ...VALID_FOOD_INPUT, name: 'Riz basmati' });
    expect(other.ok).toBe(true);
    if (!other.ok) return;

    const archived = await repository.archive(created.value.id);
    expect(archived.ok).toBe(true);

    const results = await searchOnce(repository, '');
    expect(results.map((food) => food.id)).not.toContain(created.value.id);
    expect(results.map((food) => food.id)).toContain(other.value.id);

    // The record itself still exists (archiving is not deletion).
    const record = await database.get('foods').find(created.value.id);
    expect(record).toBeTruthy();
  });

  it('delete() actually removes the record from the database', async () => {
    const created = await repository.create(VALID_FOOD_INPUT);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const deleted = await repository.delete(created.value.id);
    expect(deleted.ok).toBe(true);

    const findResult = await repository.findById(created.value.id);
    expect(findResult.ok).toBe(false);
    if (findResult.ok) return;
    expect(findResult.error.code).toBe('FOOD_NOT_FOUND');

    const count = await database.get('foods').query().fetchCount();
    expect(count).toBe(0);
  });

  describe('assertNonNegative (RM14)', () => {
    it('rejects a negative value on create', async () => {
      const result = await repository.create({ ...VALID_FOOD_INPUT, calories: -1 });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('NEGATIVE_VALUE');

      const count = await database.get('foods').query().fetchCount();
      expect(count).toBe(0);
    });

    it('rejects a negative value on update', async () => {
      const created = await repository.create(VALID_FOOD_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const result = await repository.update(created.value.id, { calories: -5 });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('NEGATIVE_VALUE');

      // The original value is untouched.
      const findResult = await repository.findById(created.value.id);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;
      expect(findResult.value.calories).toBe(165);
    });

    it('accepts a referenceQuantity of exactly 0 on create (0 is not negative)', async () => {
      const result = await repository.create({ ...VALID_FOOD_INPUT, referenceQuantity: 0 });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.referenceQuantity).toBe(0);
    });

    it('accepts a referenceQuantity of exactly 0 on update (0 is not negative)', async () => {
      const created = await repository.create(VALID_FOOD_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const updated = await repository.update(created.value.id, { referenceQuantity: 0 });

      expect(updated.ok).toBe(true);
      if (!updated.ok) return;
      expect(updated.value.referenceQuantity).toBe(0);
    });
  });

  describe('search() name+brand matching (KCAL-101, F12)', () => {
    it('finds a food by brand alone, not just by name', async () => {
      const yogurt = await repository.create({
        ...VALID_FOOD_INPUT,
        name: 'Yaourt nature',
        brand: 'Danone',
      });
      expect(yogurt.ok).toBe(true);
      if (!yogurt.ok) return;
      const otherFood = await repository.create({
        ...VALID_FOOD_INPUT,
        name: 'Fromage blanc',
        brand: 'Nactalia',
      });
      expect(otherFood.ok).toBe(true);
      if (!otherFood.ok) return;

      const results = await searchOnce(repository, 'Danone');

      expect(results.map((food) => food.id)).toEqual([yogurt.value.id]);
    });

    it('still finds a food by name when it has no brand', async () => {
      const noBrand = await repository.create({
        ...VALID_FOOD_INPUT,
        name: 'Pomme',
        brand: undefined,
      });
      expect(noBrand.ok).toBe(true);
      if (!noBrand.ok) return;

      const results = await searchOnce(repository, 'Pomme');

      expect(results.map((food) => food.id)).toEqual([noBrand.value.id]);
    });

    it('returns all non-archived foods for an empty query (unchanged behavior)', async () => {
      const first = await repository.create(VALID_FOOD_INPUT);
      expect(first.ok).toBe(true);
      if (!first.ok) return;
      const second = await repository.create({ ...VALID_FOOD_INPUT, name: 'Riz basmati' });
      expect(second.ok).toBe(true);
      if (!second.ok) return;

      const results = await searchOnce(repository, '');

      expect(results.map((food) => food.id).sort()).toEqual(
        [first.value.id, second.value.id].sort(),
      );
    });
  });

  describe('food_portions (KCAL-163b)', () => {
    const PORTIONS_INPUT: CreateFoodInput = {
      ...VALID_FOOD_INPUT,
      portions: [
        { label: '1 pot', quantity: 150, unit: 'g', position: 0 },
        { label: '1 c. à soupe', quantity: 15, unit: 'g', position: 1 },
      ],
    };

    it('writes the portions list atomically alongside the food, ordered by position', async () => {
      const created = await repository.create(PORTIONS_INPUT);

      expect(created.ok).toBe(true);
      if (!created.ok) return;
      expect(created.value.portions.map((portion) => portion.label)).toEqual([
        '1 pot',
        '1 c. à soupe',
      ]);

      const rows = await database.get<FoodPortionModel>('food_portions').query().fetch();
      expect(rows).toHaveLength(2);
      expect(rows.every((row) => row.foodId === created.value.id)).toBe(true);
    });

    it('findById returns portions ordered by position', async () => {
      const created = await repository.create(PORTIONS_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const found = await repository.findById(created.value.id);

      expect(found.ok).toBe(true);
      if (!found.ok) return;
      expect(found.value.portions).toEqual([
        expect.objectContaining({ label: '1 pot', quantity: 150, position: 0 }),
        expect.objectContaining({ label: '1 c. à soupe', quantity: 15, position: 1 }),
      ]);
    });

    it('search() does not load portions (KCAL-163b: avoids a second N+1 on the library list)', async () => {
      const created = await repository.create(PORTIONS_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const results = await searchOnce(repository, '');

      const found = results.find((food) => food.id === created.value.id);
      expect(found).toBeTruthy();
      expect(found?.portions).toEqual([]);
    });

    it('update() replaces the full portions set rather than diffing', async () => {
      const created = await repository.create(PORTIONS_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const updated = await repository.update(created.value.id, {
        portions: [{ label: '1 tranche', quantity: 30, unit: 'g', position: 0 }],
      });

      expect(updated.ok).toBe(true);
      if (!updated.ok) return;
      expect(updated.value.portions.map((portion) => portion.label)).toEqual(['1 tranche']);

      const rows = await database.get<FoodPortionModel>('food_portions').query().fetch();
      expect(rows).toHaveLength(1);
    });

    it('update() without a `portions` key leaves the existing portions untouched', async () => {
      const created = await repository.create(PORTIONS_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const updated = await repository.update(created.value.id, { calories: 200 });

      expect(updated.ok).toBe(true);
      if (!updated.ok) return;
      expect(updated.value.portions).toHaveLength(2);
    });

    it("delete() cascades to the food's portion rows", async () => {
      const created = await repository.create(PORTIONS_INPUT);
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const deleted = await repository.delete(created.value.id);
      expect(deleted.ok).toBe(true);

      const rows = await database.get<FoodPortionModel>('food_portions').query().fetch();
      expect(rows).toHaveLength(0);
    });
  });
});

describe('foods migration v4 -> v5 (food_portions backfill)', () => {
  // Mirrors schema.ts as it existed before this ticket (schema version 4): no `food_portions`
  // table yet, and `recipe_ingredients` has no `portion_id` column. Every table used by
  // `modelClasses` must be present here too (CollectionMap validates static table <-> schema
  // table pairing at Database construction), so this otherwise-unused fixture repeats the
  // rest of the pre-ticket schema verbatim, not just the `foods` table under test.
  //
  // `food_portions` doesn't exist at v4, so `v4ModelClasses` excludes FoodPortion to match
  // (adding an empty `food_portions` table here just to satisfy CollectionMap would make the
  // migration step below fail with "table already exists" when it tries to create it).
  const v4ModelClasses = modelClasses.filter((modelClass) => modelClass.table !== 'food_portions');

  const schemaV4 = appSchema({
    version: 4,
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
          { name: 'is_archived', type: 'boolean' },
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
      `kcalvi-foods-migration-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`,
    );
  });

  afterEach(() => {
    // The SQLite adapters opened below are never explicitly closed (WatermelonDB's Node
    // SQLite adapter exposes no public close()), so just remove the on-disk files -- an
    // open file descriptor doesn't stop unlink on macOS/Linux.
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(dbPath + suffix);
      } catch {
        // Sidecar file may not exist -- nothing to clean up.
      }
    }
  });

  it('backfills exactly one food_portions row per food that had a serving_quantity, and none for foods without one', async () => {
    // Step 1: a fresh v4-only install (no `migrations` passed -- this is `setUpWithSchema`,
    // not a migration) with two foods: one carrying the old serving_quantity/serving_unit
    // shortcut, one without.
    const v4Adapter = new SQLiteAdapter({ dbName: dbPath, schema: schemaV4 });
    const v4Database = new Database({ adapter: v4Adapter, modelClasses: v4ModelClasses });

    const foodIds = await v4Database.write(async () => {
      const collection = v4Database.get<FoodModel>('foods');
      const withPortion = await collection.create((row) => {
        row.name = 'Yaourt nature';
        row.calories = 60;
        row.protein = 5;
        row.carbs = 4;
        row.fat = 2;
        row.referenceQuantity = 100;
        row.referenceUnit = 'g';
        row.servingQuantity = 125;
        row.servingUnit = 'g';
        row.isFavorite = false;
        row.isArchived = false;
      });
      const withoutPortion = await collection.create((row) => {
        row.name = 'Pomme';
        row.calories = 52;
        row.protein = 0.3;
        row.carbs = 14;
        row.fat = 0.2;
        row.referenceQuantity = 100;
        row.referenceUnit = 'g';
        row.isFavorite = false;
        row.isArchived = false;
      });
      return { withPortion: withPortion.id, withoutPortion: withoutPortion.id };
    });

    // Step 2: reopen the same on-disk file with the current (v5) schema and migrations. The
    // file's stored PRAGMA user_version is still 4, so the adapter runs schemaMigrations,
    // which is what actually exercises the toVersion: 5 step (createTable + addColumns +
    // the INSERT ... SELECT backfill), not just a fresh v5 install.
    const v5Adapter = new SQLiteAdapter({ dbName: dbPath, schema, migrations });
    const v5Database = new Database({ adapter: v5Adapter, modelClasses });
    const repository = new LocalFoodRepository(v5Database);

    const withPortionResult = await repository.findById(foodIds.withPortion);
    expect(withPortionResult.ok).toBe(true);
    if (!withPortionResult.ok) return;
    expect(withPortionResult.value.portions).toHaveLength(1);
    expect(withPortionResult.value.portions[0]).toEqual(
      expect.objectContaining({ quantity: 125, unit: 'g', foodId: foodIds.withPortion }),
    );

    const withoutPortionResult = await repository.findById(foodIds.withoutPortion);
    expect(withoutPortionResult.ok).toBe(true);
    if (!withoutPortionResult.ok) return;
    expect(withoutPortionResult.value.portions).toEqual([]);
  });
});
