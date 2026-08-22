import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

import { isOverGoal } from '@/domain/calculations';
import HeroCard from '@/ui/HeroCard';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatInteger, formatLongDate } from '@/utils/format';

import { TopRow, getPillStyle, styles } from './JournalHeroCard.styles';

export type JournalHeroCardProps = {
  day: Date;
  consumedCalories: number;
  dailyCalorieGoal: number;
};

/**
 * The selected day's hero (2b): its date, the day total against the goal, and the status pill.
 *
 * The over-goal test is the shared `isOverGoal` predicate (KCAL-188), the same one ArcGauge
 * uses on Today -- the threshold lives in one place so the two screens can't drift apart.
 */
export function JournalHeroCard({ day, consumedCalories, dailyCalorieGoal }: JournalHeroCardProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  const overGoal = isOverGoal(consumedCalories, dailyCalorieGoal);

  return (
    <HeroCard>
      <TopRow>
        <Text variant="overline" color="onDark.muted">
          {formatLongDate(day)}
        </Text>

        <View style={getPillStyle(theme, overGoal)}>
          <Text
            variant="micro"
            style={{
              color: overGoal ? theme.colors.terracotta[300] : theme.colors.azure[400],
            }}
            testID="journal.statusPill"
          >
            {overGoal ? t('journal.status.over') : t('journal.status.inTarget')}
          </Text>
        </View>
      </TopRow>

      <Text variant="stat" color="onDark.primary" style={styles.total} testID="journal.dayTotal">
        {formatInteger(consumedCalories)}
      </Text>
      <Text variant="caption" color="onDark.muted" style={styles.goal}>
        {t('journal.hero.goal', { goal: formatInteger(dailyCalorieGoal) })}
      </Text>
    </HeroCard>
  );
}

export default JournalHeroCard;
