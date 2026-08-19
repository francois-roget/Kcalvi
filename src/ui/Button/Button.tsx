import { Pressable, type PressableProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import {
  getButtonHeight,
  getVariantColors,
  styles,
  type ButtonSize,
  type ButtonVariant,
} from './Button.styles';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  disabled,
  ...props
}: ButtonProps) {
  const theme = useTheme() as Theme;
  const height = getButtonHeight(size);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={({ pressed }) => {
        const { backgroundColor } = getVariantColors(theme, variant, pressed);
        return [
          styles.base,
          {
            height,
            backgroundColor,
            borderRadius: theme.radius.lg,
            // Full-width buttons (lg) keep the wider padding from the design handoff;
            // constrained ones (md, e.g. side-by-side action rows) need more room for
            // the label so it doesn't wrap (see KCAL-154).
            paddingHorizontal: size === 'lg' ? theme.spacing[6] : theme.spacing[4],
            opacity: disabled ? 0.45 : 1,
          },
        ];
      }}
      {...props}
    >
      {({ pressed }) => {
        const { textColor } = getVariantColors(theme, variant, pressed);
        return (
          <Text
            variant={variant === 'ghost' ? 'bodySm' : 'title'}
            style={
              variant === 'ghost'
                ? { color: textColor, fontFamily: 'Manrope_700Bold', fontSize: 13 }
                : { color: textColor }
            }
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {label}
          </Text>
        );
      }}
    </Pressable>
  );
}

export default Button;
