import { Pressable, type PressableProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import {
  getLabelStyle,
  getPressableStyle,
  styles,
  type ButtonSize,
  type ButtonVariant,
} from './Button.styles';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function Button({ label, variant = 'primary', size = 'lg', disabled, ...props }: ButtonProps) {
  const theme = useTheme() as Theme;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        getPressableStyle(theme, variant, size, pressed, Boolean(disabled)),
      ]}
      {...props}
    >
      {({ pressed }) => (
        <Text
          variant={variant === 'ghost' ? 'bodySm' : 'title'}
          style={getLabelStyle(theme, variant, pressed)}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export default Button;
