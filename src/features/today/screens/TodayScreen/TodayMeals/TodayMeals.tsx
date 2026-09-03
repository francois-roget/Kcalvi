import { useTranslation } from 'react-i18next';

import { MEAL_TYPES, type DiaryEntry, type MealType } from '@/domain/types';
import { MealCard } from '@/features/today/components/MealCard';
import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { Container, HeaderRow } from './TodayMeals.styles';

export type TodayMealsProps = {
  entriesByMeal: Record<MealType, DiaryEntry[]>;
  onMealPress: (mealType: MealType) => void;
  onSeeAllPress: () => void;
};

/**
 * The « Repas » section of 2a: an overline title with « Tout voir », then the four meal cards.
 *
 * Iterates MEAL_TYPES rather than listing the meals here, so the display order stays F10's and
 * lives in one place (KCAL-170).
 */
export function TodayMeals({ entriesByMeal, onMealPress, onSeeAllPress }: TodayMealsProps) {
  const { t } = useTranslation();

  return (
    <Container testID="today.meals">
      <HeaderRow>
        <Text variant="overline" color="text.tertiary">
          {t('today.meals.title')}
        </Text>
        <Button
          testID="today.meals.seeAll"
          label={t('today.meals.seeAll')}
          variant="ghost"
          size="md"
          onPress={onSeeAllPress}
        />
      </HeaderRow>

      {MEAL_TYPES.map((mealType) => (
        <MealCard
          key={mealType}
          mealType={mealType}
          entries={entriesByMeal[mealType]}
          onPress={() => onMealPress(mealType)}
        />
      ))}
    </Container>
  );
}

export default TodayMeals;
