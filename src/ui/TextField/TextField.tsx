import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import {
  getErrorTextStyle,
  getInputContainerStyle,
  getInputTextStyle,
  styles,
} from './TextField.styles';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  unit?: string;
  error?: string;
  numeric?: boolean;
  /** Optional helper text rendered below the field when there is no error. */
  hint?: string;
};

export function TextField({ label, unit, error, numeric = false, hint, ...props }: TextFieldProps) {
  const theme = useTheme() as Theme;

  return (
    <View>
      <Text variant="overline" color="text.tertiary" style={styles.label}>
        {label}
      </Text>

      <View style={[styles.inputContainer, getInputContainerStyle(theme, Boolean(error))]}>
        <TextInput
          style={[styles.input, getInputTextStyle(theme, numeric)]}
          placeholderTextColor={theme.colors.text.disabled}
          keyboardType={numeric ? 'decimal-pad' : props.keyboardType}
          {...props}
        />
        {unit ? (
          <Text variant="caption" color="text.quaternary" style={styles.unit}>
            {unit}
          </Text>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" style={[styles.helperText, getErrorTextStyle(theme)]}>
          {error}
        </Text>
      ) : null}

      {!error && hint ? (
        <Text variant="caption" color="text.tertiary" style={styles.helperText}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export default TextField;
