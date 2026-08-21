import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Recipe } from '@/domain/types';
import BottomSheet from '@/ui/BottomSheet';
import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { DialogActions, styles } from './ArchiveRecipeSheet.styles';

export type ArchiveRecipeSheetProps = {
  recipe: Recipe | null;
  /** Set when the last `onConfirmArchive` attempt returned a failed `Result` (mirrors
   *  `DeleteFoodSheet.errorMessage`, KCAL-153): the sheet stays open and shows this
   *  instead of closing silently. */
  errorMessage: string | null;
  onCancel: () => void;
  onConfirmArchive: () => void;
};

/**
 * KCAL-162 — "Archiver <name> ?" / explanation / Archiver (primary) · Annuler (ghost).
 * Mirrors the food deletion flow's error handling (KCAL-153): a failed `archive()`
 * Result keeps this sheet open with `errorMessage` shown, never closes silently.
 */
export function ArchiveRecipeSheet({
  recipe,
  errorMessage,
  onCancel,
  onConfirmArchive,
}: ArchiveRecipeSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet visible={recipe !== null} onClose={onCancel}>
      {recipe ? (
        <View testID="library.archiveRecipeDialog">
          <Text variant="h2">{t('library.archiveRecipeDialog.title', { name: recipe.name })}</Text>
          <Text variant="bodySm" color="text.secondary" style={styles.message}>
            {t('library.archiveRecipeDialog.message')}
          </Text>
          {errorMessage ? (
            <Text
              variant="bodySm"
              color="text.accent"
              style={styles.error}
              testID="library.archiveRecipeDialog.error"
            >
              {errorMessage}
            </Text>
          ) : null}

          <DialogActions>
            <Button
              label={t('library.archiveRecipeDialog.archive')}
              variant="primary"
              testID="library.archiveRecipeDialog.archive"
              onPress={onConfirmArchive}
            />
            <Button
              label={t('library.archiveRecipeDialog.cancel')}
              variant="ghost"
              testID="library.archiveRecipeDialog.cancel"
              onPress={onCancel}
            />
          </DialogActions>
        </View>
      ) : null}
    </BottomSheet>
  );
}

export default ArchiveRecipeSheet;
