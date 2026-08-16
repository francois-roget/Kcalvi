import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  unit?: string;
  error?: string;
  numeric?: boolean;
};

export function TextField({ label, unit, error, numeric = false, ...props }: TextFieldProps) {
  const theme = useTheme() as Theme;

  return (
    <View>
      <Text variant="overline" color="text.tertiary" style={{ marginBottom: 6 }}>
        {label}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: error ? theme.colors.terracotta[600] : theme.colors.border.default,
          borderRadius: theme.radius.md,
          paddingVertical: 12,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            fontFamily: numeric ? 'Manrope_800ExtraBold' : 'Manrope_700Bold',
            fontSize: numeric ? 17 : 15,
            color: theme.colors.text.primary,
            padding: 0,
          }}
          placeholderTextColor={theme.colors.text.disabled}
          keyboardType={numeric ? 'decimal-pad' : props.keyboardType}
          {...props}
        />
        {unit ? (
          <Text variant="caption" color="text.quaternary" style={{ marginLeft: 8 }}>
            {unit}
          </Text>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" style={{ color: theme.colors.terracotta[600], marginTop: 6 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default TextField;
