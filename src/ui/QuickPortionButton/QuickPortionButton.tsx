import { Pressable, type PressableProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

export type QuickPortionButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  selected?: boolean;
};

export function QuickPortionButton({ label, selected = false, ...props }: QuickPortionButtonProps) {
  const theme = useTheme() as Theme;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        paddingVertical: 11,
        paddingHorizontal: 13,
        borderRadius: theme.radius.sm,
        backgroundColor: selected ? '#E9F1F6' : theme.colors.sand[300],
      }}
      {...props}
    >
      <Text
        variant="bodySm"
        style={{
          color: selected ? theme.colors.text.accent : theme.colors.text.secondary,
          fontFamily: selected ? 'Manrope_700Bold' : 'Manrope_600SemiBold',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default QuickPortionButton;
