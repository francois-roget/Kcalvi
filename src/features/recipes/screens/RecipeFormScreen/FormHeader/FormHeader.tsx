import { useTranslation } from 'react-i18next';

import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { HeaderRow } from './FormHeader.styles';

export type FormHeaderProps = {
  isEditMode: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSave: () => void;
};

/**
 * Top bar: cancel ghost button, screen title, and the header "save" action -- gated on
 * `canSubmit` in lockstep with the bottom submit button (KCAL-155).
 */
export function FormHeader({ isEditMode, canSubmit, onCancel, onSave }: FormHeaderProps) {
  const { t } = useTranslation();

  return (
    <HeaderRow>
      <Button
        testID="recipeForm.header.cancel"
        label={t('recipeForm.header.cancel')}
        variant="ghost"
        size="md"
        onPress={onCancel}
      />
      <Text variant="title">
        {isEditMode ? t('recipeForm.header.editTitle') : t('recipeForm.header.createTitle')}
      </Text>
      <Button
        testID="recipeForm.header.save"
        label={t('recipeForm.header.save')}
        variant="ghost"
        size="md"
        disabled={!canSubmit}
        accessibilityHint={canSubmit ? undefined : t('recipeForm.submitDisabledHint')}
        onPress={onSave}
      />
    </HeaderRow>
  );
}

export default FormHeader;
