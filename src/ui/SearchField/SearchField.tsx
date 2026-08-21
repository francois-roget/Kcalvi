import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

import {
  clearButtonStyle,
  getClearIconSize,
  getContainerStyle,
  getInputStyle,
} from './SearchField.styles';

export type SearchFieldProps = Omit<TextInputProps, 'style'> & {
  /** Called when the user taps the clear (×) button. Optional: without it, no clear button is rendered. */
  onClear?: () => void;
};

export function SearchField({ onClear, value, ...props }: SearchFieldProps) {
  const theme = useTheme() as Theme;
  const { t } = useTranslation();

  const showClearButton = Boolean(onClear) && Boolean(value);

  return (
    <View style={getContainerStyle(theme)}>
      <TextInput
        style={getInputStyle(theme, showClearButton)}
        placeholderTextColor="#9AA5AD"
        value={value}
        {...props}
      />
      {showClearButton ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={t('common.clearSearch')}
          hitSlop={10}
          style={clearButtonStyle}
        >
          <Ionicons name="close-circle" size={getClearIconSize(theme)} color="#9AA5AD" />
        </Pressable>
      ) : null}
    </View>
  );
}

export default SearchField;
