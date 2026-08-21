import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const ButtonsRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

export const styles = StyleSheet.create({
  duplicateWrapper: { flex: 1 },
  addToMealWrapper: { flex: 2 },
});
