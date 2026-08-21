import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';

export const CardRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const CardActions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 14px;
`;

export const styles = StyleSheet.create({
  nameColumn: { flexShrink: 1, paddingRight: 12 },
  kcalLabel: { marginTop: 2 },
});
