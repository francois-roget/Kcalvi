import type { TextProps as RNTextProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

import { StyledText } from './Text.styles';

export type TextVariant = keyof Theme['typography'];
export type TextColor =
  `text.${keyof Theme['colors']['text']}` | `onDark.${keyof Theme['colors']['onDark']}`;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: TextColor;
};

function resolveColor(theme: Theme, color: TextColor): string {
  const [scheme, tone] = color.split('.') as ['text' | 'onDark', string];
  return (theme.colors[scheme] as Record<string, string>)[tone];
}

function Text({ variant = 'body', color = 'text.primary', ...props }: TextProps) {
  const theme = useTheme() as Theme;
  const typo = theme.typography[variant];

  return (
    <StyledText
      $fontFamily={typo.fontFamily}
      $fontSize={typo.fontSize}
      $letterSpacing={'letterSpacing' in typo ? typo.letterSpacing : 0}
      $textTransform={'textTransform' in typo ? typo.textTransform : 'none'}
      $color={resolveColor(theme, color)}
      {...props}
    />
  );
}

export default Text;
