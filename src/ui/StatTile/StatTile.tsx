import { useTheme } from 'styled-components/native';

import Card, { type CardProps } from '@/ui/Card';
import Text, { type TextColor } from '@/ui/Text';
import type { Theme } from '@/ui/theme';

export type StatTileTone = 'dark' | 'accent' | 'warm';

export type StatTileProps = {
  label: string;
  value: string;
  tone?: StatTileTone;
};

const TONE_CONFIG: Record<StatTileTone, { cardTone: CardProps['tone']; labelColor: TextColor }> = {
  dark: { cardTone: 'dark', labelColor: 'onDark.subtle' },
  accent: { cardTone: 'accent', labelColor: 'text.tertiary' },
  warm: { cardTone: 'warm', labelColor: 'text.tertiary' },
};

export function StatTile({ label, value, tone = 'dark' }: StatTileProps) {
  const theme = useTheme() as Theme;
  const config = TONE_CONFIG[tone];
  const isDark = tone === 'dark';

  return (
    <Card
      tone={config.cardTone}
      radius={isDark ? 'md' : '2xl'}
      paddingVertical={isDark ? 10 : 13}
      paddingHorizontal={isDark ? 12 : 15}
    >
      <Text variant="micro" color={config.labelColor}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Manrope_700Bold',
          fontSize: 15,
          color: isDark ? theme.colors.onDark.primary : theme.colors.text.primary,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </Card>
  );
}

export default StatTile;
