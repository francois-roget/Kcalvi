import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { ButtonsRow, styles } from './RecipeActionsFooter.styles';

export type RecipeActionsFooterProps = {
  duplicating: boolean;
  duplicateError: boolean;
  onDuplicate: () => void;
};

/** "Dupliquer" (KCAL-141) + disabled "Ajouter au repas" CTA, with the inline duplicate error. */
export function RecipeActionsFooter({
  duplicating,
  duplicateError,
  onDuplicate,
}: RecipeActionsFooterProps) {
  const { t } = useTranslation();

  return (
    <>
      {duplicateError ? (
        <Text variant="bodySm" color="text.accent" testID="recipeDetail.duplicateError">
          {t('recipeDetail.duplicate.error')}
        </Text>
      ) : null}

      <ButtonsRow>
        <View style={styles.duplicateWrapper}>
          <Button
            testID="recipeDetail.actions.duplicate"
            label={t('recipeDetail.actions.duplicate')}
            variant="secondary"
            disabled={duplicating}
            onPress={onDuplicate}
          />
        </View>
        <View style={styles.addToMealWrapper}>
          {/* KCAL-141: DiaryEntryRepository/AddEntryScreen don't exist until Sprint 3
              (SPRINT2-DETAILS.MD), so this CTA is rendered visibly disabled with no
              onPress action -- same pattern as LibraryScreen's disabled empty-state
              secondary CTA (KCAL-108). */}
          <Button
            testID="recipeDetail.actions.addToMeal"
            label={t('recipeDetail.actions.addToMeal')}
            variant="primary"
            disabled
            accessibilityHint={t('recipeDetail.actions.addToMealHint')}
          />
        </View>
      </ButtonsRow>
    </>
  );
}

export default RecipeActionsFooter;
