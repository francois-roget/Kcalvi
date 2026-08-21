import { useTranslation } from 'react-i18next';

import { calculateProportionalNutrition } from '@/domain/calculations';
import type { Food, RecipeIngredient } from '@/domain/types';
import ListCard from '@/ui/ListCard';
import ListRow from '@/ui/ListRow';
import Text from '@/ui/Text';
import { formatDecimal, formatInteger, unitLabel } from '@/utils/format';

import { SectionBlock } from './IngredientList.styles';

export type IngredientListProps = {
  items: { ingredient: RecipeIngredient; food: Food }[];
  totalCalories: number;
};

/** Ingredient rows + recipe-level total (KCAL-140). */
export function IngredientList({ items, totalCalories }: IngredientListProps) {
  const { t } = useTranslation();

  return (
    <SectionBlock>
      <Text variant="overline" color="text.tertiary">
        {t('recipeDetail.ingredients.sectionTitle')}
      </Text>
      <ListCard>
        {items.map(({ ingredient, food }) => (
          <ListRow
            key={ingredient.id}
            label={food.name}
            sublabel={`${formatDecimal(ingredient.quantity)} ${unitLabel(t, ingredient.unit)}`}
            value={t('recipeDetail.ingredients.kcalValue', {
              value: formatInteger(
                calculateProportionalNutrition(food, ingredient.quantity).calories,
              ),
            })}
          />
        ))}
        <ListRow
          label={t('recipeDetail.ingredients.totalLabel')}
          value={t('recipeDetail.ingredients.kcalValue', { value: formatInteger(totalCalories) })}
        />
      </ListCard>
    </SectionBlock>
  );
}

export default IngredientList;
