import { StyleSheet, type TextStyle } from 'react-native';
import styled from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export const HeroRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[4]}px;
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

export const styles = StyleSheet.create({
  kcalValue: { marginTop: 8 },
});

export function getProteinValueStyle(theme: Theme): TextStyle {
  return { color: theme.colors.terracotta[300] };
}

export function getCarbsValueStyle(theme: Theme): TextStyle {
  return { color: theme.colors.azure[400] };
}
