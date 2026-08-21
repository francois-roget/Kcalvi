import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import type { FoodFormScreenProps } from '@/navigation/types';
import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { CategoryField } from './CategoryField';
import { FavoriteToggleCard } from './FavoriteToggleCard';
import { useFoodForm } from './FoodFormScreen.helpers';
import { Content, LoadingContainer, Safe, scrollContentStyle } from './FoodFormScreen.styles';
import { FoodFormHeader } from './FoodFormHeader';
import { IdentityFields } from './IdentityFields';
import { MacroFields } from './MacroFields';
import { NutritionPreviewCard } from './NutritionPreviewCard';
import { PortionsSection } from './PortionsSection';
import { ReferenceUnitField } from './ReferenceUnitField';

export function FoodFormScreen({ route, navigation }: FoodFormScreenProps) {
  const { t } = useTranslation();
  const form = useFoodForm(route, navigation);

  if (form.loading) {
    return (
      <Safe edges={['top', 'bottom']}>
        <LoadingContainer>
          <Text variant="body" color="text.secondary">
            {t('foodForm.loading')}
          </Text>
        </LoadingContainer>
      </Safe>
    );
  }

  return (
    <Safe edges={['top', 'bottom']}>
      <FoodFormHeader
        isEditMode={form.isEditMode}
        submitting={form.submitting}
        onCancel={() => navigation.goBack()}
        onSave={form.handleSubmitPress}
      />

      <ScrollView contentContainerStyle={scrollContentStyle}>
        <Content>
          {form.loadError ? (
            <Text variant="bodySm" color="text.accent">
              {t('foodForm.notFoundError')}
            </Text>
          ) : null}

          <IdentityFields control={form.control} errors={form.errors} />

          <ReferenceUnitField control={form.control} />

          <MacroFields control={form.control} errors={form.errors} />

          <CategoryField control={form.control} />

          <PortionsSection
            portions={form.portions}
            editingPortionId={form.editingPortionId}
            onOpenEditor={form.onOpenPortionEditor}
            onRemove={form.onRemovePortion}
            editor={form.portionEditor}
          />

          <NutritionPreviewCard
            quantity={form.previewQuantity}
            unitCode={form.previewUnitCode}
            nutrition={form.previewNutrition}
          />

          <FavoriteToggleCard control={form.control} />

          {form.rootError ? (
            <Text variant="bodySm" color="text.accent" testID="foodForm.rootError">
              {form.rootError}
            </Text>
          ) : null}

          <Button
            testID="foodForm.submit"
            label={t('foodForm.submit')}
            variant="primary"
            onPress={form.handleSubmitPress}
            disabled={form.submitting}
          />
        </Content>
      </ScrollView>
    </Safe>
  );
}

export default FoodFormScreen;
