import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export const Row = styled.View`
  flex-direction: row;
  gap: 6px;
`;

export function getDayStyle(theme: Theme, selected: boolean) {
  return {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.lg,
    backgroundColor: selected ? theme.colors.ink[800] : theme.colors.sand[200],
  };
}

export const styles = StyleSheet.create({
  dayNumber: { marginTop: 2 },
});
