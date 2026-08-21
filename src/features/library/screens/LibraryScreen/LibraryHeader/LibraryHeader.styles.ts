import type { ViewStyle } from 'react-native';
import { styled } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export function getAddButtonStyle(theme: Theme): ViewStyle {
  return {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ink[800],
  };
}
