import type { Database } from '@nozbe/watermelondb';

import { createTestDatabase } from '../database/createTestDatabase';
import FoodModel from '../database/models/Food';
import { toDomainFood } from './mapping';

describe('toDomainFood (real SQLite via better-sqlite3)', () => {
  let database: Database;

  beforeEach(() => {
    database = createTestDatabase();
  });

  it('normalizes every unset optional column from `null` (WatermelonDB) to `undefined` (domain)', async () => {
    // Only the required (non-optional) columns are set here -- `brand`, `fiber`, `sugar`,
    // `servingQuantity`, `servingUnit`, `category`, `barcode`, and `source` are all left
    // untouched, so SQLite stores them as NULL and WatermelonDB reads them back as `null`.
    const record = await database.write(() =>
      database.get<FoodModel>('foods').create((food) => {
        food.name = 'Pomme';
        food.calories = 52;
        food.protein = 0.3;
        food.carbs = 14;
        food.fat = 0.2;
        food.referenceQuantity = 100;
        food.referenceUnit = 'g';
        food.isFavorite = false;
        food.isArchived = false;
      }),
    );

    // Re-fetch from the database so this exercises the real WatermelonDB read path
    // (a freshly `.create()`d record and a `.find()`d one can differ in edge cases).
    const fetched = await database.get<FoodModel>('foods').find(record.id);

    // Assert the raw WatermelonDB model does read the unset columns back as `null`,
    // confirming this test actually exercises the bug `toDomainFood` is meant to fix.
    expect(fetched.brand).toBeNull();
    expect(fetched.fiber).toBeNull();
    expect(fetched.sugar).toBeNull();
    expect(fetched.servingQuantity).toBeNull();
    expect(fetched.servingUnit).toBeNull();
    expect(fetched.category).toBeNull();
    expect(fetched.barcode).toBeNull();
    expect(fetched.source).toBeNull();

    const food = toDomainFood(fetched);

    expect(food.brand).toBeUndefined();
    expect(food.fiber).toBeUndefined();
    expect(food.sugar).toBeUndefined();
    expect(food.servingQuantity).toBeUndefined();
    expect(food.servingUnit).toBeUndefined();
    expect(food.category).toBeUndefined();
    expect(food.barcode).toBeUndefined();
    expect(food.source).toBeUndefined();

    // Required fields still pass through untouched.
    expect(food.name).toBe('Pomme');
    expect(food.calories).toBe(52);
  });
});
