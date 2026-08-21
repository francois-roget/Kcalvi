import { StyleSheet } from 'react-native';

import type { Theme } from '@/ui/theme';

export const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  unit: {
    marginLeft: 8,
  },
  helperText: {
    marginTop: 6,
  },
});

export function getInputContainerStyle(theme: Theme, hasError: boolean) {
  return {
    borderColor: hasError ? theme.colors.terracotta[600] : theme.colors.border.default,
    borderRadius: theme.radius.md,
  };
}

export function getInputTextStyle(theme: Theme, numeric: boolean) {
  return {
    fontFamily: numeric ? 'Manrope_800ExtraBold' : 'Manrope_700Bold',
    fontSize: numeric ? 17 : 15,
    color: theme.colors.text.primary,
  };
}

export function getErrorTextStyle(theme: Theme) {
  return {
    color: theme.colors.terracotta[600],
  };
}
