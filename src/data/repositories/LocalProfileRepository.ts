import type { Database } from '@nozbe/watermelondb';
import { map, type Observable } from '@nozbe/watermelondb/utils/rx';

import type { ActivityLevel, DomainError, Result, Sex, UserProfile } from '@/domain/types';
import { err, ok } from '@/domain/types/result';

import UserProfileModel from '../database/models/UserProfile';
import type { CreateProfileInput, ProfileRepository } from './ProfileRepository';

function toDomainProfile(record: UserProfileModel): UserProfile {
  return {
    id: record.id,
    name: record.name,
    dailyCalorieGoal: record.dailyCalorieGoal,
    proteinGoal: record.proteinGoal,
    carbGoal: record.carbGoal,
    fatGoal: record.fatGoal,
    startWeight: record.startWeight,
    currentWeight: record.currentWeight,
    targetWeight: record.targetWeight,
    sex: record.sex as Sex,
    age: record.age,
    height: record.height,
    activityLevel: record.activityLevel as ActivityLevel,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class LocalProfileRepository implements ProfileRepository {
  constructor(private readonly database: Database) {}

  observe(): Observable<UserProfile | null> {
    return this.database
      .get<UserProfileModel>('user_profiles')
      .query()
      .observe()
      .pipe(map((records) => (records[0] ? toDomainProfile(records[0]) : null)));
  }

  async create(input: CreateProfileInput): Promise<Result<UserProfile, DomainError>> {
    // Only one profile is possible (RootNavigator.tsx observes records[0] as the
    // source of truth for onboarding state): we explicitly reject a 2nd insert
    // rather than letting the unique index on `singleton` (migrations.ts, v3)
    // fail silently at the SQL level.
    const existingCount = await this.database
      .get<UserProfileModel>('user_profiles')
      .query()
      .fetchCount();
    if (existingCount > 0) {
      return err({ code: 'PROFILE_ALREADY_EXISTS', message: 'A profile already exists' });
    }

    const record = await this.database.write(() =>
      this.database.get<UserProfileModel>('user_profiles').create((profile) => {
        profile.name = input.name;
        profile.dailyCalorieGoal = input.dailyCalorieGoal;
        profile.proteinGoal = input.proteinGoal;
        profile.carbGoal = input.carbGoal;
        profile.fatGoal = input.fatGoal;
        profile.startWeight = input.startWeight;
        profile.currentWeight = input.currentWeight;
        profile.targetWeight = input.targetWeight;
        profile.sex = input.sex;
        profile.age = input.age;
        profile.height = input.height;
        profile.activityLevel = input.activityLevel;
        profile.singleton = 1;
      }),
    );

    return ok(toDomainProfile(record));
  }

  async reset(): Promise<Result<void, DomainError>> {
    const records = await this.database.get<UserProfileModel>('user_profiles').query().fetch();
    await this.database.write(() =>
      Promise.all(records.map((record) => record.destroyPermanently())),
    );
    return ok(undefined);
  }
}
