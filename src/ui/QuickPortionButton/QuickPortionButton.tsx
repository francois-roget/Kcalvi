import { Pressable, type PressableProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { getButtonStyle, getLabelStyle } from './QuickPortionButton.styles';

export type QuickPortionButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  selected?: boolean;
};

function QuickPortionButton({ label, selected = false, ...props }: QuickPortionButtonProps) {
  const theme = useTheme() as Theme;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={getButtonStyle(theme, selected)}
      {...props}
    >
      <Text variant="bodySm" style={getLabelStyle(theme, selected)}>
        {label}
      </Text>
    </Pressable>
  );
}

export default QuickPortionButton;
