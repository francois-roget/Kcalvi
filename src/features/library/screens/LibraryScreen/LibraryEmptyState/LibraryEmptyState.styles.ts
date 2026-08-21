import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';

export const CenteredContent = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  gap: ${({ theme }) => theme.spacing[4]}px;
`;

export const EmptyIconSquare = styled.View`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.xl}px;
  background-color: ${({ theme }) => theme.colors.azure[100]};
  align-items: center;
  justify-content: center;
`;

export const EmptyActions = styled.View`
  width: 100%;
  gap: 9px;
  margin-top: ${({ theme }) => theme.spacing[3]}px;
`;

export const styles = StyleSheet.create({
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 19, textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 20 },
});
