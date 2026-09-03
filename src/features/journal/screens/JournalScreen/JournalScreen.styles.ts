import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'styled-components/native';

export const Safe = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.sand[100]};
`;

export const Header = styled.View`
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-top: ${({ theme }) => theme.spacing[5]}px;
`;

export const Content = styled.View`
  padding-horizontal: ${({ theme }) => theme.layout.screenPaddingH}px;
  padding-top: ${({ theme }) => theme.spacing[5]}px;
  gap: ${({ theme }) => theme.spacing[5]}px;
`;

export const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 26 },
  month: { marginTop: 2 },
  footnote: { marginTop: 4 },
});

export const Container = styled.View`
  gap: ${({ theme }) => theme.spacing[2]}px;
`;

export const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;
