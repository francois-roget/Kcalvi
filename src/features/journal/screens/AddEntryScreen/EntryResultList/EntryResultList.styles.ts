import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  list: { flex: 1 },
  // Bottom padding so the last row clears the sheet/home indicator rather than sitting flush
  // against the screen edge.
  listContent: { gap: 8, paddingBottom: 24 },
});
