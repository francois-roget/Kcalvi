import { useTranslation } from 'react-i18next';

import QuickPortionButton from '@/ui/QuickPortionButton';
import Text from '@/ui/Text';

import type { PortionDraft } from '../FoodFormScreen.helpers';
import { PortionEditor, type PortionEditorProps } from './PortionEditor';
import { PortionPill } from './PortionPill';
import { ChipRow } from './PortionsSection.styles';

export type PortionsSectionProps = {
  portions: PortionDraft[];
  editingPortionId: string | 'new' | null;
  onOpenEditor: (target: string | 'new') => void;
  onRemove: (tempId: string) => void;
  editor: PortionEditorProps;
};

/**
 * "Portions usuelles" section (KCAL-163e): a real multi-portion list -- one pill per
 * portion (tap to edit), a "+ Ajouter" pill, and the inline create/edit editor.
 */
export function PortionsSection({
  portions,
  editingPortionId,
  onOpenEditor,
  onRemove,
  editor,
}: PortionsSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="title">{t('foodForm.quickPortions.title')}</Text>
      <ChipRow>
        {portions.map((portion) => (
          <PortionPill
            key={portion.tempId}
            portion={portion}
            selected={editingPortionId === portion.tempId}
            onSelect={() => onOpenEditor(portion.tempId)}
            onDelete={() => onRemove(portion.tempId)}
          />
        ))}
        <QuickPortionButton
          testID="foodForm.quickPortions.add"
          label={t('foodForm.quickPortions.add')}
          onPress={() => onOpenEditor('new')}
        />
      </ChipRow>

      {editingPortionId !== null ? <PortionEditor {...editor} /> : null}
    </>
  );
}

export default PortionsSection;
