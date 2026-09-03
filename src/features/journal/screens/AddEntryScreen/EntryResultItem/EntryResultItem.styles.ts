import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const CardRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const NameRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const styles = StyleSheet.create({
  nameColumn: { flexShrink: 1, paddingRight: 12 },
  referenceLabel: { marginTop: 2 },
  name: { flexShrink: 1 },
});
