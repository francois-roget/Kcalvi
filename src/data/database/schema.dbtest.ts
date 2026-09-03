import { Database, appSchema, tableSchema } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import DatabaseBridge from '@nozbe/watermelondb/adapters/sqlite/sqlite-node/DatabaseBridge';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { LocalDiaryEntryRepository } from '../repositories/LocalDiaryEntryRepository';
import { createTestDatabase } from './createTestDatabase';
import { migrations } from './migrations';
import { modelClasses } from './models';
import FoodModel from './models/Food';
import FoodPortionModel from './models/FoodPortion';
import RecipeModel from './models/Recipe';
import { schema } from './schema';

/**
 * Deliberately whitebox test (reaches into WatermelonDB's Node dispatcher
 * internals): there's no public API to read the SQL actually compiled.
 * Justified by the regression it covers — a fresh database compiles only
 * schema.ts (never migrations.ts, which only applies to existing-schema
 * updates): an index added only via a migration would be silently missing
 * on any first install of the app.
 */
type RawSqliteRow = { name: string };
type RawSqliteStatement = { all: (arg: string) => RawSqliteRow[] };
type RawSqliteInstance = { prepare: (sql: string) => RawSqliteStatement };
type NodeBridgeConnections = {
  connections: Record<string, { driver: { database: { instance: RawSqliteInstance } } }>;
};

function getCompiledIndexNames(database: ReturnType<typeof createTestDatabase>, table: string) {
  const adapter = database.adapter as unknown as {
    underlyingAdapter: { _initPromise: Promise<unknown>; _tag: string };
  };
  return adapter.underlyingAdapter._initPromise.then(() => {
    const tag = adapter.underlyingAdapter._tag;
    const bridge = DatabaseBridge as NodeBridgeConnections;
    const rows = bridge.connections[tag].driver.database.instance
      .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=?`)
      .all(table);
    return rows.map((row) => row.name);
  });
}

describe('user_profiles schema (fresh install path)', () => {
  it('includes the singleton UNIQUE index without ever running migrations.ts', async () => {
    const database = createTestDatabase();
    const indexNames = await getCompiledIndexNames(database, 'user_profiles');

    expect(indexNames).toContain('index_user_profiles_singleton');
  });
});

/**
 * KCAL-196 — the v5 → v6 migration must leave an existing library untouched.
 *
 * The v6 step only adds columns to `diary_entries` and runs no backfill (that table is empty on
 * every device, see migrations.ts), so nothing should touch `foods` or `recipes`. This test is
 * what makes that a checked property rather than an assumption: a migration step written
 * against the wrong table, or an accidental data-modifying statement, would show up here.
 */
describe('migration v5 -> v6 (diary_entries columns) on a populated database', () => {
  // Derived from the current schema rather than copied verbatim: v6 differs from v5 only by the
  // three `diary_entries` columns, so filtering them out is both shorter and immune to drift in
  // the tables this test isn't about. The `user_profiles` unsafeSql hook is dropped along the
  // way, which is fine here -- this fixture exercises foods/recipes survival, not that index.
  const V6_DIARY_COLUMNS = ['label', 'portion_id', 'updated_at'];

  const schemaV5 = appSchema({
    version: 5,
    tables: Object.values(schema.tables).map((table) =>
      tableSchema({
        name: table.name,
        columns:
          table.name === 'diary_entries'
            ? table.columnArray.filter((column) => !V6_DIARY_COLUMNS.includes(column.name))
            : table.columnArray,
      }),
    ),
  });

  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kcalvi-v6-')), 'test.db');
  });

  afterEach(() => {
    // Same cleanup as the v4 -> v5 test: the adapter exposes no public close(), and an open
    // descriptor doesn't prevent unlink on macOS/Linux.
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(dbPath + suffix);
      } catch {
        // Sidecar file may not exist.
      }
    }
  });

  it('leaves existing foods and recipes intact, and accepts diary entries afterwards', async () => {
    const v5Adapter = new SQLiteAdapter({ dbName: dbPath, schema: schemaV5 });
    const v5Database = new Database({ adapter: v5Adapter, modelClasses });

    const ids = await v5Database.write(async () => {
      const food = await v5Database.get<FoodModel>('foods').create((row) => {
        row.name = 'Yaourt nature';
        row.brand = 'Danone';
        row.calories = 60;
        row.protein = 5;
        row.carbs = 4;
        row.fat = 2;
        row.referenceQuantity = 100;
        row.referenceUnit = 'g';
        row.isFavorite = true;
        row.isArchived = false;
      });
      const recipe = await v5Database.get<RecipeModel>('recipes').create((row) => {
        row.name = 'Soupe de potiron';
        row.servings = 4;
        row.isFavorite = false;
        row.isArchived = false;
      });
      const portion = await v5Database.get<FoodPortionModel>('food_portions').create((row) => {
        row.foodId = food.id;
        row.label = '1 pot';
        row.quantity = 125;
        row.unit = 'g';
        row.position = 0;
      });
      return { foodId: food.id, recipeId: recipe.id, portionId: portion.id };
    });

    // Reopen the same file with the current schema: its stored PRAGMA user_version is still 5,
    // so the adapter actually runs the toVersion: 6 step rather than doing a fresh install.
    const v6Adapter = new SQLiteAdapter({ dbName: dbPath, schema, migrations });
    const v6Database = new Database({ adapter: v6Adapter, modelClasses });

    const food = await v6Database.get<FoodModel>('foods').find(ids.foodId);
    expect(food.name).toBe('Yaourt nature');
    expect(food.brand).toBe('Danone');
    expect(food.calories).toBe(60);
    expect(food.isFavorite).toBe(true);

    const recipe = await v6Database.get<RecipeModel>('recipes').find(ids.recipeId);
    expect(recipe.name).toBe('Soupe de potiron');
    expect(recipe.servings).toBe(4);

    const portion = await v6Database.get<FoodPortionModel>('food_portions').find(ids.portionId);
    expect(portion.label).toBe('1 pot');
    expect(portion.quantity).toBe(125);

    // And the migrated table is usable: the three new columns accept a write and read back.
    const entry = await new LocalDiaryEntryRepository(v6Database).create({
      date: new Date(2026, 7, 21),
      mealType: 'BREAKFAST',
      source: { kind: 'food', foodId: ids.foodId, portionId: ids.portionId },
      quantity: 125,
      unit: 'g',
      calories: 75,
      protein: 6.25,
      carbs: 5,
      fat: 2.5,
      label: 'Yaourt nature',
    });

    expect(entry.ok).toBe(true);
    if (!entry.ok) return;
    expect(entry.value.label).toBe('Yaourt nature');
    expect(entry.value.portionId).toBe(ids.portionId);
  });
});
