import { Pressable, StyleSheet } from 'react-native';
import { styled } from 'styled-components/native';

export const PickerResultRow = styled(Pressable)`
  padding-vertical: ${({ theme }) => theme.spacing[3]}px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border.subtle};
`;

export const styles = StyleSheet.create({
  container: { flex: 1, flexShrink: 1 },
  searchField: { marginTop: 12 },
  resultsList: { marginTop: 12, flex: 1 },
  noResults: { paddingVertical: 12 },
  resultSubtitle: { marginTop: 2 },
});
