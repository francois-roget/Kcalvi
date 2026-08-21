import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import QuickPortionButton from '@/ui/QuickPortionButton';
import type { Theme } from '@/ui/theme';

import { numberToText, type PortionDraft } from '../../FoodFormScreen.helpers';
import { PillRow } from './PortionPill.styles';

export type PortionPillProps = {
  portion: PortionDraft;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

/** One "Portions usuelles" pill (tap to edit) + its per-row delete icon (KCAL-163e). */
export function PortionPill({ portion, selected, onSelect, onDelete }: PortionPillProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <PillRow>
      <QuickPortionButton
        testID={`foodForm.quickPortions.pill.${portion.tempId}`}
        label={
          portion.label ||
          `${numberToText(portion.quantity)} ${t(`foodForm.units.${portion.unit}`)}`
        }
        selected={selected}
        onPress={onSelect}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('foodForm.quickPortions.deleteLabel', { label: portion.label })}
        hitSlop={10}
        testID={`foodForm.quickPortions.delete.${portion.tempId}`}
        onPress={onDelete}
      >
        <Ionicons name="close-circle-outline" size={16} color={theme.colors.text.tertiary} />
      </Pressable>
    </PillRow>
  );
}

export default PortionPill;
