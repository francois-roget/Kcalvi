import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

import { getRowStyle, styles } from './ListRow.styles';
import { ListRowLabel } from './ListRowLabel';
import { ListRowValue } from './ListRowValue';

export type ListRowAccessory = 'chevron' | 'toggle' | 'star';

export type ListRowProps = {
  label: string;
  value?: string;
  sublabel?: string;
  accessory?: ListRowAccessory;
  accessoryValue?: boolean;
  onAccessoryChange?: (value: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
  /** Highlights the value (e.g. selected option in a choice list). */
  selected?: boolean;
  /** Displays a star rating (out of `maxStars`, default 4) instead of `value`. */
  stars?: number;
  maxStars?: number;
};

export function ListRow({
  label,
  value,
  sublabel,
  accessory,
  accessoryValue = false,
  onAccessoryChange,
  onPress,
  isLast,
  selected = false,
  stars,
  maxStars = 4,
}: ListRowProps) {
  const theme = useTheme() as Theme;
  const { t } = useTranslation();

  const content = (
    <View style={[styles.row, getRowStyle(theme, selected, isLast)]}>
      <ListRowLabel theme={theme} label={label} sublabel={sublabel} selected={selected} />
      <ListRowValue
        theme={theme}
        value={value}
        stars={stars}
        maxStars={maxStars}
        selected={selected}
        accessory={accessory}
        accessoryValue={accessoryValue}
        onAccessoryChange={onAccessoryChange}
        starsAccessibilityLabel={
          stars !== undefined ? t('common.starsRating', { count: stars, max: maxStars }) : undefined
        }
      />
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      {content}
    </Pressable>
  );
}

export default ListRow;
