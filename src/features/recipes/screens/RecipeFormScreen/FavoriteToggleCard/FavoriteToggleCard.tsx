import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Card from '@/ui/Card';
import Text from '@/ui/Text';
import Toggle from '@/ui/Toggle';

import type { RecipeFormValues } from '../RecipeFormScreen.helpers';
import { FavoriteRow } from './FavoriteToggleCard.styles';

export type FavoriteToggleCardProps = {
  control: Control<RecipeFormValues>;
};

/**
 * KCAL-161 — favorite toggle. Deliberately duplicated (not shared) with FoodFormScreen's
 * near-identical card: the two screens are owned by separate workstreams, by design.
 */
export function FavoriteToggleCard({ control }: FavoriteToggleCardProps) {
  const { t } = useTranslation();

  return (
    <Card tone="light">
      <FavoriteRow>
        <Text variant="body">{t('recipeForm.favorite')}</Text>
        <Controller
          control={control}
          name="isFavorite"
          render={({ field }) => (
            <Toggle
              testID="recipeForm.favorite"
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </FavoriteRow>
    </Card>
  );
}

export default FavoriteToggleCard;
