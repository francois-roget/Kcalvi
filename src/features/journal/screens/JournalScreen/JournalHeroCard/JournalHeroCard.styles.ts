import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export const TopRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

/**
 * « Dans la cible » sits on a translucent azure ground, « Au-dessus » on terracotta (2b).
 * Built here rather than as tokens: these two are the only translucent fills in the app.
 */
export function getPillStyle(theme: Theme, overGoal: boolean) {
  return {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: overGoal ? 'rgba(196, 100, 60, 0.18)' : 'rgba(79, 176, 232, 0.18)',
  };
}

export const styles = StyleSheet.create({
  total: { marginTop: 10 },
  goal: { marginTop: 2 },
  pill: { flexShrink: 0 },
});
