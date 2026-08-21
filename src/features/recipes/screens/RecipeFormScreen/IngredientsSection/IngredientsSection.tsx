import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { calculateProportionalNutrition } from '@/domain/calculations';
import Card from '@/ui/Card';
import ListCard from '@/ui/ListCard';
import Text from '@/ui/Text';

import type { IngredientDraft } from '../RecipeFormScreen.helpers';
import { IngredientRow } from './IngredientRow';
import { SectionBlock, styles } from './IngredientsSection.styles';

export type IngredientsSectionProps = {
  ingredients: IngredientDraft[];
  onOpenPicker: () => void;
  onRemoveIngredient: (tempId: string) => void;
};

/**
 * KCAL-132/133 — the ingredient list (name, quantity, per-row kcal) and the
 * "+ Ajouter un ingrédient" entry point into the picker sheet.
 */
export function IngredientsSection({
  ingredients,
  onOpenPicker,
  onRemoveIngredient,
}: IngredientsSectionProps) {
  const { t } = useTranslation();

  return (
    <SectionBlock>
      <Text variant="overline" color="text.tertiary">
        {t('recipeForm.ingredients.title')}
      </Text>

      {ingredients.length === 0 ? (
        <Text variant="bodySm" color="text.tertiary">
          {t('recipeForm.ingredients.empty')}
        </Text>
      ) : (
        <ListCard>
          {ingredients.map((draft, index) => (
            <IngredientRow
              key={draft.tempId}
              draft={draft}
              kcal={calculateProportionalNutrition(draft.food, draft.referenceQuantity).calories}
              onDelete={() => onRemoveIngredient(draft.tempId)}
              isLast={index === ingredients.length - 1}
            />
          ))}
        </ListCard>
      )}

      <Pressable
        accessibilityRole="button"
        testID="recipeForm.addIngredient"
        onPress={onOpenPicker}
      >
        <Card tone="dashed">
          <Text variant="body" color="text.accent" style={styles.addLabel}>
            {t('recipeForm.addIngredient')}
          </Text>
        </Card>
      </Pressable>
    </SectionBlock>
  );
}

export default IngredientsSection;
