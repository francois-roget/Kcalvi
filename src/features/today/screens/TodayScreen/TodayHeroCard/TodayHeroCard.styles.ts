import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const GaugeWrapper = styled.View`
  align-items: center;
`;

export const TileRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing[2]}px;
`;

export const styles = StyleSheet.create({
  // Each tile takes an equal third of the row regardless of its value's width, so the three
  // stay aligned when one reads "1 245" and another "0".
  tile: { flex: 1 },
  tileRow: { marginTop: 14 },
});
