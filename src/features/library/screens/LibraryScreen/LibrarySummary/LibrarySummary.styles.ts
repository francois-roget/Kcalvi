import type { TextStyle } from 'react-native';
import { styled } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export const HeroRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const HeroColumn = styled.View`
  flex: 1;
  align-items: center;
  gap: 4px;
`;

export const HeroDivider = styled.View`
  width: 1px;
  align-self: stretch;
  background-color: ${({ theme }) => theme.colors.ink[700]};
`;

// `Text`'s `color` prop only accepts `text.*`/`onDark.*` tokens (see `ui/Text`), so the
// terracotta/azure accents used for the recipes/favorites stats need a style override instead.
export function getRecipeStatStyle(theme: Theme): TextStyle {
  return { color: theme.colors.terracotta[300] };
}

export function getFavoriteStatStyle(theme: Theme): TextStyle {
  return { color: theme.colors.azure[400] };
}
