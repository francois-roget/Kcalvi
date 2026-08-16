import { Pressable, type PressableProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

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
      style={{
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? theme.colors.ink[800] : theme.colors.sand[300],
      }}
      {...props}
    >
      <Text
        style={{
          color: selected ? '#FFFFFF' : theme.colors.text.secondary,
          fontFamily: selected ? 'Manrope_700Bold' : 'Manrope_600SemiBold',
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default Chip;
