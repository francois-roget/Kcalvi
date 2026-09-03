import { Model, type Relation } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';

import type Food from './Food';
import type Recipe from './Recipe';

export default class DiaryEntry extends Model {
  static table = 'diary_entries';
  static associations = {
    foods: { type: 'belongs_to' as const, key: 'food_id' },
    recipes: { type: 'belongs_to' as const, key: 'recipe_id' },
  };

  @date('date') date!: Date;
  @field('meal_type') mealType!: string;
  @field('food_id') foodId?: string;
  @field('recipe_id') recipeId?: string;
  @field('quantity') quantity!: number;
  @field('unit') unit!: string;
  @field('calories') calories!: number;
  @field('protein') protein!: number;
  @field('carbs') carbs!: number;
  @field('fat') fat!: number;
  // KCAL-166: display name frozen at write time, independent of the linked
  // Food/Recipe being later renamed, edited, or deleted (RM16).
  @field('label') label!: string;
  // KCAL-166: same role as RecipeIngredient.portionId (KCAL-163d) -- which
  // food_portions row this entry was entered via, if any. May dangle if that
  // portion is later deleted; callers must fall back gracefully.
  @field('portion_id') portionId?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('foods', 'food_id') food!: Relation<Food>;
  @relation('recipes', 'recipe_id') recipe!: Relation<Recipe>;
}
