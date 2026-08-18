import { database } from '../database';
import type { FoodRepository } from './FoodRepository';
import { LocalFoodRepository } from './LocalFoodRepository';
import { LocalProfileRepository } from './LocalProfileRepository';
import type { ProfileRepository } from './ProfileRepository';

export const foodRepository: FoodRepository = new LocalFoodRepository(database);
export const profileRepository: ProfileRepository = new LocalProfileRepository(database);

// The other repositories (Recipe, DiaryEntry, ActivityEntry, WeightEntry,
// Badge) follow the same interface + Local*Repository pattern
// (see TECHNICAL_SPECS.MD §5.2) and will be added as the corresponding
// features are implemented.
