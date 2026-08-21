import { useTranslation } from 'react-i18next';

import type { Food } from '@/domain/types';
import Text from '@/ui/Text';

import { FoodListItem } from '../FoodListItem';
import { SectionBlock } from '../SectionBlock';

export type FoodsSectionProps = {
  foods: Food[];
  onFoodPress: (foodId: string) => void;
  onToggleFavorite: (food: Food) => void;
  onDeletePress: (food: Food) => void;
};

/** KCAL-106/157 — "Aliments" section: the food list, or "Aucun résultat" when empty. */
export function FoodsSection({
  foods,
  onFoodPress,
  onToggleFavorite,
  onDeletePress,
}: FoodsSectionProps) {
  const { t } = useTranslation();

  return (
    <SectionBlock testID="library.section.foods" title={t('library.sections.foods')}>
      {foods.length === 0 ? (
        <Text variant="bodySm" color="text.tertiary">
          {t('library.list.noResults')}
        </Text>
      ) : (
        foods.map((food) => (
          <FoodListItem
            key={food.id}
            food={food}
            onPress={() => onFoodPress(food.id)}
            onToggleFavorite={() => onToggleFavorite(food)}
            onDeletePress={() => onDeletePress(food)}
          />
        ))
      )}
    </SectionBlock>
  );
}

export default FoodsSection;
