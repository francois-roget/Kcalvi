import { Model } from '@nozbe/watermelondb';
import { date, field } from '@nozbe/watermelondb/decorators';

export default class Badge extends Model {
  static table = 'badges';

  @field('type') type!: string;
  @date('earned_date') earnedDate!: Date;
  @date('period_start') periodStart!: Date;
  @date('period_end') periodEnd!: Date;
}
