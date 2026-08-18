import type { Database } from '@nozbe/watermelondb';
import type { Observable } from '@nozbe/watermelondb/utils/rx';

import { createTestDatabase } from '../database/createTestDatabase';
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
});
