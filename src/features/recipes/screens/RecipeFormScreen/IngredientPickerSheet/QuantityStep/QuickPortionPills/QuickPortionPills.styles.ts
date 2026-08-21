import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const ChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]}px;
`;

export const styles = StyleSheet.create({
  quickPortions: { marginTop: 12 },
});
