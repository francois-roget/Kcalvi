import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const Container = styled.View`
  padding-horizontal: ${({ theme }) => theme.spacing[5]}px;
  padding-bottom: ${({ theme }) => theme.spacing[6]}px;
  gap: ${({ theme }) => theme.spacing[2]}px;
`;

export const styles = StyleSheet.create({
  subtitle: { marginTop: 2, marginBottom: 8 },
  error: { marginTop: 4 },
});
