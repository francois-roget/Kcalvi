import { useTranslation } from 'react-i18next';

import type { NutritionValues } from '@/domain/types';
import Card from '@/ui/Card';
import Text from '@/ui/Text';
import { formatDecimal, formatInteger } from '@/utils/format';

import type { ReferenceUnit } from '../FoodFormScreen.helpers';
import { styles } from './NutritionPreviewCard.styles';

export type NutritionPreviewCardProps = {
  quantity: number;
  unitCode: ReferenceUnit;
  nutrition: NutritionValues;
};

// KCAL-163e: the caller resolves `quantity`/`unitCode` from the first portion by ascending
// position, falling back to the reference quantity when there are no portions at all.
/** Live "per selected portion" nutrition preview. */
export function NutritionPreviewCard({ quantity, unitCode, nutrition }: NutritionPreviewCardProps) {
  const { t } = useTranslation();

  return (
    <Card tone="accent" testID="foodForm.preview">
      <Text variant="overline" color="text.tertiary">
        {t('foodForm.preview.title', {
          quantity: formatInteger(quantity),
          unit: t(`foodForm.units.${unitCode}`),
        })}
      </Text>
      <Text variant="body" color="text.primary" style={styles.summary}>
        {t('foodForm.preview.summary', {
          calories: formatInteger(nutrition.calories),
          protein: formatDecimal(nutrition.protein),
          carbs: formatDecimal(nutrition.carbs),
          fat: formatDecimal(nutrition.fat),
        })}
      </Text>
    </Card>
  );
}

export default NutritionPreviewCard;
