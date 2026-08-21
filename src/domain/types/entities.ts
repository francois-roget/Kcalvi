export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER';

export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'active' | 'very_active';

export type UserProfile = {
  id: string;
  name: string;
  dailyCalorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  sex: Sex;
  age: number;
  height: number;
  activityLevel: ActivityLevel;
  createdAt: Date;
  updatedAt: Date;
};

export type Food = {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  referenceQuantity: number;
  referenceUnit: string;
  category?: string;
  barcode?: string;
  source?: string;
  isFavorite: boolean;
  isArchived: boolean;
  // KCAL-163: real multi-portion model. `search()` doesn't load this (avoids a second N+1
  // on top of the one KCAL-158 already solved for recipe calories) -- only `findById` and
  // the few call sites that need portion data populate it; everywhere else it's `[]`.
  portions: FoodPortion[];
  createdAt: Date;
  updatedAt: Date;
};

/** KCAL-163: a single named quick portion for a Food (e.g. "1 pot" = 150 g). `quantity` is
 *  always expressed in the owning Food's `referenceUnit` -- see
 *  `convertPortionToReferenceQuantity` (domain/calculations). */
export type FoodPortion = {
  id: string;
  foodId: string;
  label: string;
  quantity: number;
  unit: string;
  position: number;
};

export type Recipe = {
  id: string;
  name: string;
  servings: number;
  notes?: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  foodId: string;
  quantity: number;
  unit: string;
  // KCAL-163d: the food_portions row this ingredient was entered via, if any (undefined when
  // entered directly in the food's reference unit). May be a dangling reference if that
  // portion was later deleted -- resolve defensively, never assume it still exists.
  portionId?: string;
};

export type DiaryEntry = {
  id: string;
  date: Date;
  mealType: MealType;
  foodId?: string;
  recipeId?: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Frozen at write time, independent of the linked Food/Recipe being later
  // renamed, edited, or deleted (RM16).
  label: string;
  // Which food_portions row this entry was entered via, if any. May be a
  // dangling reference if that portion was later deleted -- resolve
  // defensively, never assume it still exists.
  portionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ActivityEntry = {
  id: string;
  date: Date;
  name: string;
  duration: number;
  caloriesBurned: number;
  notes?: string;
};

export type WeightEntry = {
  id: string;
  date: Date;
  weight: number;
  notes?: string;
};

export type Badge = {
  id: string;
  type: string;
  earnedDate: Date;
  periodStart: Date;
  periodEnd: Date;
};

export type NutritionValues = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
