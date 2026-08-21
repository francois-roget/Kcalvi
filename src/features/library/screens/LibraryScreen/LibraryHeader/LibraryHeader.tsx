import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { getAddButtonStyle, HeaderRow } from './LibraryHeader.styles';

export type LibraryHeaderProps = {
  /** Omitted on the KCAL-108 empty-library state, which shows the title alone. */
  onAddPress?: () => void;
};

/** Screen title + "+" button that navigates to FoodForm in create mode. */
export function LibraryHeader({ onAddPress }: LibraryHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  return (
    <HeaderRow>
      <Text variant="h1">{t('tabs.library')}</Text>
      {onAddPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('library.addButtonLabel')}
          hitSlop={8}
          testID="library.addButton"
          onPress={onAddPress}
          style={getAddButtonStyle(theme)}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </HeaderRow>
  );
}

export default LibraryHeader;
