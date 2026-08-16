export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER';

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
  servingQuantity?: number;
  servingUnit?: string;
  category?: string;
  barcode?: string;
  source?: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Recipe = {
  id: string;
  name: string;
  servings: number;
  notes?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  foodId: string;
  quantity: number;
  unit: string;
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
  createdAt: Date;
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
