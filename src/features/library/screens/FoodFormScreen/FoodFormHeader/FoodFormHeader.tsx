import { useTranslation } from 'react-i18next';

import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { HeaderRow } from './FoodFormHeader.styles';

export type FoodFormHeaderProps = {
  isEditMode: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSave: () => void;
};

/** Cancel / title / save top bar (KCAL-116/118). */
export function FoodFormHeader({ isEditMode, submitting, onCancel, onSave }: FoodFormHeaderProps) {
  const { t } = useTranslation();

  return (
    <HeaderRow>
      <Button
        testID="foodForm.header.cancel"
        label={t('foodForm.header.cancel')}
        variant="ghost"
        size="md"
        onPress={onCancel}
      />
      <Text variant="title">
        {isEditMode ? t('foodForm.header.editTitle') : t('foodForm.header.createTitle')}
      </Text>
      <Button
        testID="foodForm.header.save"
        label={t('foodForm.header.save')}
        variant="ghost"
        size="md"
        disabled={submitting}
        onPress={onSave}
      />
    </HeaderRow>
  );
}

export default FoodFormHeader;
