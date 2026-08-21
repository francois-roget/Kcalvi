import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { calculateConsumedCalories, calculateRemainingCalories } from '@/domain/calculations';
import type { DiaryEntry } from '@/domain/types';
import ArcGauge from '@/ui/ArcGauge';
import HeroCard from '@/ui/HeroCard';
import StatTile from '@/ui/StatTile';
import { formatInteger } from '@/utils/format';

import { GaugeWrapper, TileRow, styles } from './TodayHeroCard.styles';

export type TodayHeroCardProps = {
  entries: DiaryEntry[];
  dailyCalorieGoal: number;
};

/**
 * Today's calorie hero (2a): the consumed/goal gauge plus the Consommé / Brûlé / Restant
 * tiles.
 *
 * « Brûlé » is 0 and inert: there is no ActivityRepository until Sprint 5, and the activity
 * screen it would link to (2m) doesn't exist yet. It is rendered rather than hidden so the
 * three-tile layout is the real one from the start.
 */
export function TodayHeroCard({ entries, dailyCalorieGoal }: TodayHeroCardProps) {
  const { t } = useTranslation();

  const consumed = calculateConsumedCalories(entries); // RM04
  // No activity data yet, so net consumption is just what was eaten. Passed through
  // calculateRemainingCalories (RM07) as the plain `net` it expects rather than special-cased
  // -- when RM05's burned calories arrive in Sprint 5, only `net` changes here.
  const burned = 0;
  const remaining = calculateRemainingCalories(dailyCalorieGoal, consumed - burned);

  return (
    <HeroCard>
      <GaugeWrapper>
        <ArcGauge
          value={consumed}
          goal={dailyCalorieGoal}
          subtitle={t('today.hero.goal', { goal: formatInteger(dailyCalorieGoal) })}
        />
      </GaugeWrapper>

      <View style={styles.tileRow}>
        <TileRow>
          <View style={styles.tile}>
            <StatTile label={t('today.hero.consumed')} value={formatInteger(consumed)} />
          </View>
          <View style={styles.tile}>
            <StatTile label={t('today.hero.burned')} value={formatInteger(burned)} />
          </View>
          <View style={styles.tile}>
            <StatTile label={t('today.hero.remaining')} value={formatInteger(remaining)} />
          </View>
        </TileRow>
      </View>
    </HeroCard>
  );
}

export default TodayHeroCard;
