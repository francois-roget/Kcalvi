import type { FoodRepository } from './FoodRepository';
import { LocalFoodRepository } from './LocalFoodRepository';

export const foodRepository: FoodRepository = new LocalFoodRepository();

// Les autres repositories (Recipe, DiaryEntry, ActivityEntry, WeightEntry,
// Badge, UserProfile) suivent le même pattern interface + Local*Repository
// (voir TECHNICAL_SPECS.MD §5.2) et seront ajoutés au fil de l'implémentation
// des features correspondantes.
