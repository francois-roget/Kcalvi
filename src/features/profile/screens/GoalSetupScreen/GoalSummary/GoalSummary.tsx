import { useTranslation } from 'react-i18next';

import type { NutritionValues } from '@/domain/types';
import HeroCard from '@/ui/HeroCard';
import ListCard from '@/ui/ListCard';
import ListRow from '@/ui/ListRow';
import StatTile from '@/ui/StatTile';
import Text from '@/ui/Text';
import { formatInteger, formatKcal } from '@/utils/format';

import { heroValueStyle, InfoBox, StatRow } from './GoalSummary.styles';

export type GoalSummaryProps = {
  tdee: number;
  deficit: number;
  dailyCalorieGoal: number;
  weeklyBudget: number;
  macros: NutritionValues;
};

export function GoalSummary({
  tdee,
  deficit,
  dailyCalorieGoal,
  weeklyBudget,
  macros,
}: GoalSummaryProps) {
  const { t } = useTranslation();

  return (
    <>
      <HeroCard>
        <Text variant="overline" color="onDark.subtle">
          {t('onboarding.goalSetup.dailyCalories')}
        </Text>
        <Text variant="display" color="onDark.primary" style={heroValueStyle}>
          {formatInteger(dailyCalorieGoal)}
        </Text>
      </HeroCard>

      <StatRow>
        <StatTile
          label={t('onboarding.goalSetup.maintenance')}
          value={formatKcal(tdee)}
          tone="accent"
        />
        <StatTile
          label={t('onboarding.goalSetup.deficit')}
          value={`-${formatKcal(deficit)}`}
          tone="accent"
        />
        <StatTile
          label={t('onboarding.goalSetup.week')}
          value={formatKcal(weeklyBudget)}
          tone="accent"
        />
      </StatRow>

      <ListCard>
        <ListRow
          label={t('onboarding.goalSetup.protein')}
          value={`${formatInteger(macros.protein)} g`}
        />
        <ListRow
          label={t('onboarding.goalSetup.carbs')}
          value={`${formatInteger(macros.carbs)} g`}
        />
        <ListRow
          label={t('onboarding.goalSetup.fat')}
          value={`${formatInteger(macros.fat)} g`}
          isLast
        />
      </ListCard>

      <InfoBox>
        <Text variant="bodySm" color="text.secondary">
          {t('onboarding.goalSetup.weeklyBudgetInfo')}
        </Text>
      </InfoBox>
    </>
  );
}

export default GoalSummary;
