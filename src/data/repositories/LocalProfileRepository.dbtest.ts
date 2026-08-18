import type { Database } from '@nozbe/watermelondb';
import type { Observable } from '@nozbe/watermelondb/utils/rx';

import { createTestDatabase } from '../database/createTestDatabase';
import { LocalProfileRepository } from './LocalProfileRepository';
import type { CreateProfileInput } from './ProfileRepository';

const VALID_INPUT: CreateProfileInput = {
  name: 'François',
  dailyCalorieGoal: 1800,
  proteinGoal: 120,
  carbGoal: 180,
  fatGoal: 50,
  startWeight: 80,
  currentWeight: 80,
  targetWeight: 75,
  sex: 'male',
  age: 30,
  height: 178,
  activityLevel: 'light',
};

function collectEmissions<T>(observable: Observable<T>, count: number): Promise<T[]> {
  return new Promise((resolve) => {
    const values: T[] = [];
    const subscription = observable.subscribe((value) => {
      values.push(value);
      if (values.length === count) {
        subscription.unsubscribe();
        resolve(values);
      }
    });
  });
}

describe('LocalProfileRepository (real SQLite via better-sqlite3)', () => {
  let database: Database;
  let repository: LocalProfileRepository;

  beforeEach(() => {
    database = createTestDatabase();
    repository = new LocalProfileRepository(database);
  });

  it('creates a profile and returns the persisted domain object', async () => {
    const result = await repository.create(VALID_INPUT);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBeTruthy();
    expect(result.value.name).toBe('François');
    expect(result.value.dailyCalorieGoal).toBe(1800);
    expect(result.value.sex).toBe('male');
  });

  it('rejects a second create() instead of allowing a duplicate profile', async () => {
    const first = await repository.create(VALID_INPUT);
    expect(first.ok).toBe(true);

    const second = await repository.create({ ...VALID_INPUT, name: 'Quelqu’un d’autre' });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('PROFILE_ALREADY_EXISTS');

    const count = await database.get('user_profiles').query().fetchCount();
    expect(count).toBe(1);
  });

  it('observe() emits null then the created profile', async () => {
    const emissions = collectEmissions(repository.observe(), 2);
    await repository.create(VALID_INPUT);

    const [before, after] = await emissions;
    expect(before).toBeNull();
    expect(after?.name).toBe('François');
  });

  it('reset() clears the profile and allows creating a new one afterwards', async () => {
    await repository.create(VALID_INPUT);

    const resetResult = await repository.reset();
    expect(resetResult.ok).toBe(true);

    const countAfterReset = await database.get('user_profiles').query().fetchCount();
    expect(countAfterReset).toBe(0);

    const recreated = await repository.create({ ...VALID_INPUT, name: 'Nouveau profil' });
    expect(recreated.ok).toBe(true);
    if (!recreated.ok) return;
    expect(recreated.value.name).toBe('Nouveau profil');
  });
});
