import { StyleSheet, type ViewStyle } from 'react-native';

export function getContainerStyle(width: number, height: number): ViewStyle {
  return { width, height, alignItems: 'center', justifyContent: 'center' };
}

export const styles = StyleSheet.create({
  valueOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 2,
  },
});
