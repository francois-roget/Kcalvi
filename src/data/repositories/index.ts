import { database } from '../database';
import type { DiaryEntryRepository } from './DiaryEntryRepository';
import type { FoodRepository } from './FoodRepository';
import { LocalDiaryEntryRepository } from './LocalDiaryEntryRepository';
import { LocalFoodRepository } from './LocalFoodRepository';
import { LocalProfileRepository } from './LocalProfileRepository';
import { LocalRecipeRepository } from './LocalRecipeRepository';
import type { ProfileRepository } from './ProfileRepository';
import type { RecipeRepository } from './RecipeRepository';

export const foodRepository: FoodRepository = new LocalFoodRepository(database);
export const profileRepository: ProfileRepository = new LocalProfileRepository(database);
export const recipeRepository: RecipeRepository = new LocalRecipeRepository(database);
export const diaryEntryRepository: DiaryEntryRepository = new LocalDiaryEntryRepository(database);

// The remaining repositories (ActivityEntry, WeightEntry, Badge) follow the same
// interface + Local*Repository pattern (see TECHNICAL_SPECS.MD §5.2) and will be
// added as the corresponding features are implemented.
