import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Food } from '@/domain/types';
import BottomSheet from '@/ui/BottomSheet';
import Button from '@/ui/Button';
import Text from '@/ui/Text';

import type { Deletability } from '../LibraryScreen.helpers';
import { DialogActions, styles } from './DeleteFoodSheet.styles';

export type DeleteFoodSheetProps = {
  food: Food | null;
  deletability: Deletability;
  /** Set when the last `onConfirmDelete`/`onArchiveInstead` attempt returned a failed
   *  `Result` (KCAL-153): the sheet stays open and shows this instead of closing silently. */
  errorMessage: string | null;
  onCancel: () => void;
  onConfirmDelete: () => void;
  onArchiveInstead: () => void;
};

/**
 * KCAL-119/145/153 — not-in-use: "Supprimer / Annuler". In-use: "Archiver / Annuler"
 * only (RM15) -- "Supprimer quand même" was a silent no-op (`foodRepository.delete`
 * always rejects a food still referenced by a recipe) and has been removed entirely,
 * along with its `library.deleteDialog.confirm` testID in this branch.
 * `deletability` is computed from `checkFoodDeletable` against the real
 * `RecipeIngredient[]` usages fetched via `recipeRepository.findUsagesByFoodId`
 * (see `useFoodDeleteFlow`), so the "in use" branch is reachable whenever the food is
 * referenced by a recipe.
 */
export function DeleteFoodSheet({
  food,
  deletability,
  errorMessage,
  onCancel,
  onConfirmDelete,
  onArchiveInstead,
}: DeleteFoodSheetProps) {
  const { t } = useTranslation();
  const isInUse = deletability !== null && !deletability.ok;
  const recipeCount =
    deletability !== null && !deletability.ok ? deletability.error.recipeIds.length : 0;

  return (
    <BottomSheet visible={food !== null} onClose={onCancel}>
      {food ? (
        <View testID="library.deleteDialog">
          <Text variant="h2">
            {isInUse
              ? t('library.deleteDialog.inUseTitle', { count: recipeCount })
              : t('library.deleteDialog.title', { name: food.name })}
          </Text>
          <Text variant="bodySm" color="text.secondary" style={styles.message}>
            {isInUse ? t('library.deleteDialog.inUseMessage') : t('library.deleteDialog.message')}
          </Text>
          {errorMessage ? (
            <Text
              variant="bodySm"
              color="text.accent"
              style={styles.error}
              testID="library.deleteDialog.error"
            >
              {errorMessage}
            </Text>
          ) : null}

          <DialogActions>
            {isInUse ? (
              <Button
                label={t('library.deleteDialog.archive')}
                variant="primary"
                testID="library.deleteDialog.archive"
                onPress={onArchiveInstead}
              />
            ) : (
              <Button
                label={t('library.deleteDialog.confirm')}
                variant="primary"
                testID="library.deleteDialog.confirm"
                onPress={onConfirmDelete}
              />
            )}
            <Button
              label={t('library.deleteDialog.cancel')}
              variant="ghost"
              testID="library.deleteDialog.cancel"
              onPress={onCancel}
            />
          </DialogActions>
        </View>
      ) : null}
    </BottomSheet>
  );
}

export default DeleteFoodSheet;
