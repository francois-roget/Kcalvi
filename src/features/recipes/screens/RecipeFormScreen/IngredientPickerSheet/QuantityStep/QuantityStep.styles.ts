import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const Row = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[4]}px;
`;

export const styles = StyleSheet.create({
  quantityField: { marginTop: 12 },
  confirmRow: { marginTop: 16 },
});
