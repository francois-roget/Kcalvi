import { Pressable, type PressableProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { getChipLabelStyle, getChipStyle } from './Chip.styles';

export type ChipProps = Omit<PressableProps, 'style'> & {
  label: string;
  selected?: boolean;
};

export function Chip({ label, selected = false, ...props }: ChipProps) {
  const theme = useTheme() as Theme;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={getChipStyle(theme, selected)}
      {...props}
    >
      <Text style={getChipLabelStyle(theme, selected)}>{label}</Text>
    </Pressable>
  );
}

export default Chip;
