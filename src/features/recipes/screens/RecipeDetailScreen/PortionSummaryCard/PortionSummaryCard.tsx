import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { NutritionValues } from '@/domain/types';
import HeroCard from '@/ui/HeroCard';
import Text from '@/ui/Text';
import { formatDecimal, formatInteger } from '@/utils/format';

import { HeroPortionRow, MacrosColumn } from './PortionSummaryCard.styles';

export type PortionSummaryCardProps = {
  portionNutrition: NutritionValues;
};

/** Per-portion kcal + macros hero (KCAL-139, RM03 then F09). */
export function PortionSummaryCard({ portionNutrition }: PortionSummaryCardProps) {
  const { t } = useTranslation();

  return (
    <HeroCard>
      <Text variant="overline" color="onDark.subtle">
        {t('recipeDetail.perPortion.title')}
      </Text>
      <HeroPortionRow>
        <View>
          <Text variant="stat" color="onDark.primary">
            {formatInteger(portionNutrition.calories)}
          </Text>
          <Text variant="micro" color="onDark.subtle">
            {t('recipeDetail.perPortion.kcalLabel')}
          </Text>
        </View>

        <MacrosColumn>
          <Text variant="micro" color="onDark.muted">
            {t('recipeDetail.perPortion.macroProtein', {
              value: formatDecimal(portionNutrition.protein),
            })}
          </Text>
          <Text variant="micro" color="onDark.muted">
            {t('recipeDetail.perPortion.macroCarbs', {
              value: formatDecimal(portionNutrition.carbs),
            })}
          </Text>
          <Text variant="micro" color="onDark.muted">
            {t('recipeDetail.perPortion.macroFat', {
              value: formatDecimal(portionNutrition.fat),
            })}
          </Text>
        </MacrosColumn>
      </HeroPortionRow>
    </HeroCard>
  );
}

export default PortionSummaryCard;
