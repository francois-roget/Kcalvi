import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import type { NutritionValues } from '@/domain/types';
import HeroCard from '@/ui/HeroCard';
import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import { formatDecimal, formatInteger } from '@/utils/format';

import {
  getCarbsValueStyle,
  getProteinValueStyle,
  HeroColumn,
  HeroDivider,
  HeroRow,
  styles,
} from './NutritionSummaryCard.styles';

export type NutritionSummaryCardProps = {
  portionNutrition: NutritionValues;
};

/**
 * KCAL-134 — live per-portion calorie/macro summary, recomputed from the ingredient list
 * and the servings field.
 */
export function NutritionSummaryCard({ portionNutrition }: NutritionSummaryCardProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <HeroCard>
      <Text variant="overline" color="onDark.subtle">
        {t('recipeForm.perPortion.title')}
      </Text>
      <Text variant="stat" color="onDark.primary" style={styles.kcalValue}>
        {t('recipeForm.perPortion.kcalValue', { value: formatInteger(portionNutrition.calories) })}
      </Text>

      <HeroRow>
        <HeroColumn>
          <Text variant="title" style={getProteinValueStyle(theme)}>
            {formatDecimal(portionNutrition.protein)}
          </Text>
          <Text variant="micro" color="onDark.subtle">
            {t('recipeForm.perPortion.protein')}
          </Text>
        </HeroColumn>

        <HeroDivider />

        <HeroColumn>
          <Text variant="title" style={getCarbsValueStyle(theme)}>
            {formatDecimal(portionNutrition.carbs)}
          </Text>
          <Text variant="micro" color="onDark.subtle">
            {t('recipeForm.perPortion.carbs')}
          </Text>
        </HeroColumn>

        <HeroDivider />

        <HeroColumn>
          <Text variant="title" color="onDark.primary">
            {formatDecimal(portionNutrition.fat)}
          </Text>
          <Text variant="micro" color="onDark.subtle">
            {t('recipeForm.perPortion.fat')}
          </Text>
        </HeroColumn>
      </HeroRow>
    </HeroCard>
  );
}

export default NutritionSummaryCard;
