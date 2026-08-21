import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import BottomSheet from '@/ui/BottomSheet';
import NumberField from '@/ui/NumberField';
import Text from '@/ui/Text';
import { foodKcalLabel, formatGrams, formatKcal, unitLabel } from '@/utils/format';

import { useQuantitySheet, type QuantitySheetTarget } from './QuantitySheet.helpers';
import { Container, HeaderRow, MacroRow, styles } from './QuantitySheet.styles';

export type QuantitySheetProps = {
  visible: boolean;
  target: QuantitySheetTarget;
  onClose: () => void;
};

/**
 * Quantity sheet (2i), opened from AddEntryScreen's result list. `minHeightRatio` keeps the
 * sheet at a stable height across its states, the KCAL-160 fix for the ingredient picker:
 * without it the sheet visibly resizes as content appears.
 *
 * The sheet never computes nutrition itself -- it renders what `calculateProportionalNutrition`
 * (RM02) returns, per interactions.md.
 */
export function QuantitySheet({ visible, target, onClose }: QuantitySheetProps) {
  const { t } = useTranslation();
  const { quantityText, setQuantityText, nutrition } = useQuantitySheet(target);

  return (
    <BottomSheet visible={visible} onClose={onClose} minHeightRatio={0.55}>
      <Container testID="quantitySheet">
        <HeaderRow>
          <View style={styles.nameColumn}>
            <Text variant="h2">{target.food.name}</Text>
            <Text variant="caption" color="text.tertiary" style={styles.referenceLabel}>
              {foodKcalLabel(t, target.food)}
            </Text>
          </View>

          <Text
            variant="h1"
            color="text.accent"
            style={styles.kcal}
            numberOfLines={1}
            testID="quantitySheet.kcal"
          >
            {formatKcal(nutrition.calories)}
          </Text>
        </HeaderRow>

        <NumberField
          testID="quantitySheet.quantityField"
          label={t('quantitySheet.quantityLabel')}
          unit={unitLabel(t, target.food.referenceUnit)}
          value={quantityText}
          onChangeText={setQuantityText}
        />

        {/* P / G / L at one decimal. `numberOfLines={1}` on each: the design calls for a
            single nowrap line, and a long macro value must not push the row onto two. */}
        <MacroRow testID="quantitySheet.macros">
          <Text variant="caption" color="text.secondary" numberOfLines={1}>
            {t('quantitySheet.protein', { value: formatGrams(nutrition.protein) })}
          </Text>
          <Text variant="caption" color="text.secondary" numberOfLines={1}>
            {t('quantitySheet.carbs', { value: formatGrams(nutrition.carbs) })}
          </Text>
          <Text variant="caption" color="text.secondary" numberOfLines={1}>
            {t('quantitySheet.fat', { value: formatGrams(nutrition.fat) })}
          </Text>
        </MacroRow>
      </Container>
    </BottomSheet>
  );
}

export default QuantitySheet;
