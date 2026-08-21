import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const Container = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing[5]}px;
  padding-bottom: ${({ theme }) => theme.spacing[6]}px;
  gap: ${({ theme }) => theme.spacing[5]}px;
`;

export const HeaderRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]}px;
`;

export const MacroRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[5]}px;
`;

export const styles = StyleSheet.create({
  nameColumn: { flexShrink: 1 },
  referenceLabel: { marginTop: 2 },
  // The kcal readout must never wrap or shrink: it is the number the user is watching while
  // typing, so the name column is what gives way on a long name.
  kcal: { flexShrink: 0 },
});
