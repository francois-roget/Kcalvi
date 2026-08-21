import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { Food } from '@/domain/types';
import SearchField from '@/ui/SearchField';
import Text from '@/ui/Text';
import { formatInteger, unitLabel } from '@/utils/format';

import { PickerResultRow, styles } from './SearchStep.styles';

export type SearchStepProps = {
  query: string;
  onQueryChange: (value: string) => void;
  foodResults: Food[];
  onSelectFood: (food: Food) => void;
};

/**
 * Step 1 of the ingredient picker (KCAL-133): search a food by name (debounced upstream,
 * KCAL-103 pattern) and pick one to move to the quantity step.
 */
export function SearchStep({ query, onQueryChange, foodResults, onSelectFood }: SearchStepProps) {
  const { t } = useTranslation();

  return (
    <View testID="recipeForm.ingredientPicker.search" style={styles.container}>
      <Text variant="h2">{t('recipeForm.picker.searchTitle')}</Text>
      <View style={styles.searchField}>
        <SearchField
          value={query}
          onChangeText={onQueryChange}
          onClear={() => onQueryChange('')}
          placeholder={t('recipeForm.picker.searchPlaceholder')}
          accessibilityLabel={t('recipeForm.picker.searchPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          testID="recipeForm.ingredientPicker.searchField"
        />
      </View>

      <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
        {foodResults.length === 0 ? (
          <Text variant="bodySm" color="text.tertiary" style={styles.noResults}>
            {t('recipeForm.picker.noResults')}
          </Text>
        ) : (
          foodResults.map((food) => (
            <PickerResultRow
              key={food.id}
              accessibilityRole="button"
              testID={`recipeForm.ingredientPicker.result.${food.id}`}
              onPress={() => onSelectFood(food)}
            >
              <Text variant="body" color="text.primary">
                {food.name}
              </Text>
              <Text variant="caption" color="text.tertiary" style={styles.resultSubtitle}>
                {formatInteger(food.referenceQuantity)} {unitLabel(t, food.referenceUnit)}
              </Text>
            </PickerResultRow>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default SearchStep;
