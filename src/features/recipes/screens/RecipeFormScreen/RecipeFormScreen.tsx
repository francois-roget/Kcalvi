import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import type { RecipeFormScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { FavoriteToggleCard } from './FavoriteToggleCard';
import { FormHeader } from './FormHeader';
import { IngredientPickerSheet } from './IngredientPickerSheet';
import { IngredientsSection } from './IngredientsSection';
import { NutritionSummaryCard } from './NutritionSummaryCard';
import { RecipeFieldsSection } from './RecipeFieldsSection';
import { useRecipeForm } from './RecipeFormScreen.helpers';
import { Content, LoadingContainer, Safe, styles } from './RecipeFormScreen.styles';

export function RecipeFormScreen({ route, navigation }: RecipeFormScreenProps) {
  const { t } = useTranslation();
  const recipeId = route.params?.recipeId;
  const isEditMode = recipeId !== undefined;

  const form = useRecipeForm(recipeId, isEditMode, navigation);

  if (form.loading) {
    return (
      <Safe edges={['top', 'bottom']}>
        <LoadingContainer>
          <Text variant="body" color="text.secondary">
            {t('recipeForm.loading')}
          </Text>
        </LoadingContainer>
      </Safe>
    );
  }

  return (
    <Safe edges={['top', 'bottom']}>
      <FormHeader
        isEditMode={isEditMode}
        canSubmit={form.canSubmit}
        onCancel={() => navigation.goBack()}
        onSave={form.handleSubmit(form.onValid)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Content>
          {form.loadError ? (
            <Text variant="bodySm" color="text.accent">
              {t('recipeForm.loadError')}
            </Text>
          ) : null}

          <RecipeFieldsSection
            control={form.control}
            errors={form.errors}
            servingsForCalc={form.servingsForCalc}
            totalWeight={form.totalWeight}
            totalWeightUnit={form.totalWeightUnit}
          />

          <IngredientsSection
            ingredients={form.ingredients}
            onOpenPicker={form.openIngredientPicker}
            onRemoveIngredient={form.removeIngredient}
          />

          <NutritionSummaryCard portionNutrition={form.portionNutrition} />

          {form.rootError ? (
            <Text variant="bodySm" color="text.accent" testID="recipeForm.rootError">
              {form.rootError}
            </Text>
          ) : null}

          <FavoriteToggleCard control={form.control} />

          <Button
            testID="recipeForm.submit"
            label={t('recipeForm.submit')}
            variant="primary"
            onPress={form.handleSubmit(form.onValid)}
            disabled={!form.canSubmit}
            accessibilityHint={form.canSubmit ? undefined : t('recipeForm.submitDisabledHint')}
          />
        </Content>
      </ScrollView>

      <IngredientPickerSheet {...form.picker} />
    </Safe>
  );
}

export default RecipeFormScreen;
