import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import BottomSheet from '@/ui/BottomSheet';
import NumberField from '@/ui/NumberField';
import QuickPortionButton from '@/ui/QuickPortionButton';
import Text from '@/ui/Text';
import { foodKcalLabel, formatGrams, formatInteger, formatKcal, unitLabel } from '@/utils/format';

import { useQuantitySheet, type QuantitySheetTarget } from './QuantitySheet.helpers';
import { Container, HeaderRow, MacroRow, PortionRow, styles } from './QuantitySheet.styles';

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
 * The sheet never computes nutrition itself -- it renders what domain/calculations returns,
 * per interactions.md.
 */
export function QuantitySheet({ visible, target, onClose }: QuantitySheetProps) {
  const { t } = useTranslation();
  const {
    food,
    perPortion,
    portions,
    selectedPortionId,
    selectPortion,
    quantityText,
    editQuantity,
    nutrition,
  } = useQuantitySheet(target);

  const isFood = target.kind === 'food';
  const name = isFood ? (food?.name ?? target.food.name) : target.recipe.name;

  // A recipe's reference line is its per-portion kcal, which shows the servings line until the
  // ingredients resolve rather than a provisional "0 kcal"; a food's is its stored
  // per-reference-unit line.
  let referenceLabel = '';
  if (isFood) {
    referenceLabel = foodKcalLabel(t, food ?? target.food);
  } else if (perPortion === undefined) {
    referenceLabel = t('library.recipe.servings', { count: target.recipe.servings });
  } else {
    referenceLabel = t('library.recipe.kcalPerPortion', {
      kcal: formatInteger(perPortion.calories),
      count: target.recipe.servings,
    });
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} minHeightRatio={0.55}>
      <Container testID="quantitySheet">
        <HeaderRow>
          <View style={styles.nameColumn}>
            <Text variant="h2">{name}</Text>
            <Text variant="caption" color="text.tertiary" style={styles.referenceLabel}>
              {referenceLabel}
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
          label={isFood ? t('quantitySheet.quantityLabel') : t('quantitySheet.servingsLabel')}
          unit={
            isFood
              ? unitLabel(t, (food ?? target.food).referenceUnit)
              : t('quantitySheet.portionUnit')
          }
          value={quantityText}
          onChangeText={editQuantity}
        />

        {/* Quick portions are a food-only affordance: a recipe is already counted in portions,
            so there is nothing to shortcut. A food with no saved portions shows none either --
            the quantity field alone carries the entry, starting at its reference quantity. */}
        {portions.length === 0 ? null : (
          <PortionRow testID="quantitySheet.portions">
            {portions.map((portion) => (
              <QuickPortionButton
                key={portion.id}
                testID={`quantitySheet.portion.${portion.id}`}
                label={portion.label}
                selected={portion.id === selectedPortionId}
                onPress={() => selectPortion(portion)}
              />
            ))}
          </PortionRow>
        )}

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
