import { Model } from '@nozbe/watermelondb';
import { date, field } from '@nozbe/watermelondb/decorators';

export default class WeightEntry extends Model {
  static table = 'weight_entries';

  @date('date') date!: Date;
  @field('weight') weight!: number;
  @field('notes') notes?: string;
}
