import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Card from '@/ui/Card';
import Text from '@/ui/Text';
import Toggle from '@/ui/Toggle';

import type { FoodFormValues } from '../FoodFormScreen.helpers';
import { ToggleRow } from './FavoriteToggleCard.styles';

export type FavoriteToggleCardProps = {
  control: Control<FoodFormValues>;
};

// Deliberately not shared with RecipeFormScreen's near-identical favorite-toggle card --
// each screen keeps its own copy by design (separate parallel workstream owns that file).
/** "Favori" toggle card. */
export function FavoriteToggleCard({ control }: FavoriteToggleCardProps) {
  const { t } = useTranslation();

  return (
    <Card tone="light">
      <ToggleRow>
        <Text variant="body">{t('foodForm.favorite')}</Text>
        <Controller
          control={control}
          name="isFavorite"
          render={({ field }) => <Toggle value={field.value} onValueChange={field.onChange} />}
        />
      </ToggleRow>
    </Card>
  );
}

export default FavoriteToggleCard;
