import { StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const Container = styled.View`
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-top: ${({ theme }) => theme.spacing[5]}px;
`;

export const styles = StyleSheet.create({
  date: { marginTop: 4 },
});
