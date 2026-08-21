import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const DialogActions = styled.View`
  gap: 9px;
  margin-top: ${({ theme }) => theme.spacing[5]}px;
`;

export const styles = StyleSheet.create({
  message: { marginTop: 8 },
  error: { marginTop: 8 },
});
