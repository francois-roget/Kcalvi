import { Model, type Relation } from '@nozbe/watermelondb';
import { date, field, readonly, relation, text } from '@nozbe/watermelondb/decorators';

import type Food from './Food';

/** KCAL-163: a single named quick portion for a Food (e.g. "1 pot" = 150 g). `quantity` is
 *  always expressed in the owning Food's `reference_unit`, so converting a portion count into
 *  a reference-unit-equivalent quantity is a plain multiply (see
 *  `convertPortionToReferenceQuantity` in domain/calculations). */
export default class FoodPortion extends Model {
  static table = 'food_portions';
  static associations = {
    foods: { type: 'belongs_to' as const, key: 'food_id' },
  };

  @field('food_id') foodId!: string;
  @text('label') label!: string;
  @field('quantity') quantity!: number;
  @field('unit') unit!: string;
  @field('position') position!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('foods', 'food_id') food!: Relation<Food>;
}
