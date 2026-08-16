import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export type SearchFieldProps = Omit<TextInputProps, 'style'>;

export function SearchField(props: SearchFieldProps) {
  const theme = useTheme() as Theme;

  return (
    <TextInput
      style={{
        backgroundColor: theme.colors.sand[300],
        borderRadius: theme.radius.md,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontFamily: 'Manrope_500Medium',
        fontSize: 14,
        color: theme.colors.text.primary,
      }}
      placeholderTextColor="#9AA5AD"
      {...props}
    />
  );
}

export default SearchField;
