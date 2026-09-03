import { useTranslation } from 'react-i18next';

import type { MealType } from '@/domain/types';
import Button from '@/ui/Button';
import Text from '@/ui/Text';

import { HeaderRow } from './AddEntryHeader.styles';

export type AddEntryHeaderProps = {
  mealType: MealType;
  onCancel: () => void;
  onCreate: () => void;
};

/** Cancel / « Ajouter au <repas> » / Créer top bar (2h). */
export function AddEntryHeader({ mealType, onCancel, onCreate }: AddEntryHeaderProps) {
  const { t } = useTranslation();

  return (
    <HeaderRow>
      <Button
        testID="addEntry.header.cancel"
        label={t('addEntry.header.cancel')}
        variant="ghost"
        size="md"
        onPress={onCancel}
      />
      {/* One title key per meal rather than interpolating `meals.*` into a single
          "Ajouter au {{meal}}": French contracts the preposition with the article and
          « collation » is feminine, so the interpolated form would read « Ajouter au
          collation ». */}
      <Text variant="title">{t(`addEntry.header.title.${mealType}`)}</Text>
      <Button
        testID="addEntry.header.create"
        label={t('addEntry.header.create')}
        accessibilityHint={t('addEntry.header.createHint')}
        variant="ghost"
        size="md"
        onPress={onCreate}
      />
    </HeaderRow>
  );
}

export default AddEntryHeader;
