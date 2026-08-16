import { Model, type Query } from '@nozbe/watermelondb';
import { children, date, field, readonly, text } from '@nozbe/watermelondb/decorators';

import type RecipeIngredient from './RecipeIngredient';

export default class Food extends Model {
  static table = 'foods';
  static associations = {
    recipe_ingredients: { type: 'has_many' as const, foreignKey: 'food_id' },
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
  @field('serving_quantity') servingQuantity?: number;
  @field('serving_unit') servingUnit?: string;
  @field('category') category?: string;
  @field('barcode') barcode?: string;
  @field('source') source?: string;
  @field('is_favorite') isFavorite!: boolean;
  @field('is_archived') isArchived!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('recipe_ingredients') recipeIngredients!: Query<RecipeIngredient>;
}
