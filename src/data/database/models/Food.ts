import { Model, type Query } from '@nozbe/watermelondb';
import { children, date, field, readonly, text } from '@nozbe/watermelondb/decorators';

import type FoodPortion from './FoodPortion';
import type RecipeIngredient from './RecipeIngredient';

export default class Food extends Model {
  static table = 'foods';
  static associations = {
    recipe_ingredients: { type: 'has_many' as const, foreignKey: 'food_id' },
    food_portions: { type: 'has_many' as const, foreignKey: 'food_id' },
  };

  @text('name') name!: string;
  @field('brand') brand?: string;
  @field('calories') calories!: number;
  @field('protein') protein!: number;
  @field('carbs') carbs!: number;
  @field('fat') fat!: number;
  @field('fiber') fiber?: number;
  @field('sugar') sugar?: number;
  @field('reference_quantity') referenceQuantity!: number;
  @field('reference_unit') referenceUnit!: string;
  /**
   * @deprecated KCAL-163 replaced this single serving-size shortcut with a real multi-portion
   * model (`food_portions`, see FoodPortion.ts). The columns stay in the SQLite schema only
   * because WatermelonDB cannot cleanly drop a column, and the v5 migration backfills their
   * data into `food_portions` for every existing food. Application code must never read or
   * write `servingQuantity`/`servingUnit` again -- do not reintroduce a mapping for them in
   * mapping.ts or any repository/screen.
   */
  @field('serving_quantity') servingQuantity?: number;
  /** @deprecated see `servingQuantity` above. */
  @field('serving_unit') servingUnit?: string;
  @field('category') category?: string;
  @field('barcode') barcode?: string;
  @field('source') source?: string;
  @field('is_favorite') isFavorite!: boolean;
  @field('is_archived') isArchived!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('recipe_ingredients') recipeIngredients!: Query<RecipeIngredient>;
  @children('food_portions') portions!: Query<FoodPortion>;
}
