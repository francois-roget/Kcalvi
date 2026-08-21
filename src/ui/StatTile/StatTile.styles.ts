import type { TextStyle } from 'react-native';

import type { CardProps } from '@/ui/Card';
import type { TextColor } from '@/ui/Text';
import type { Theme } from '@/ui/theme';

export type StatTileTone = 'dark' | 'accent' | 'warm';

type StatTileToneConfig = { cardTone: CardProps['tone']; labelColor: TextColor };

const TONE_CONFIG: Record<StatTileTone, StatTileToneConfig> = {
  dark: { cardTone: 'dark', labelColor: 'onDark.subtle' },
  accent: { cardTone: 'accent', labelColor: 'text.tertiary' },
  warm: { cardTone: 'warm', labelColor: 'text.tertiary' },
};

export function getToneConfig(tone: StatTileTone): StatTileToneConfig {
  return TONE_CONFIG[tone];
}

export function getValueTextStyle(theme: Theme, tone: StatTileTone): TextStyle {
  return {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tone === 'dark' ? theme.colors.onDark.primary : theme.colors.text.primary,
    marginTop: 4,
  };
}
