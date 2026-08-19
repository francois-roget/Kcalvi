import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export type SearchFieldProps = Omit<TextInputProps, 'style'> & {
  /** Called when the user taps the clear (×) button. Optional: without it, no clear button is rendered. */
  onClear?: () => void;
};

export function SearchField({ onClear, value, ...props }: SearchFieldProps) {
  const theme = useTheme() as Theme;
  const { t } = useTranslation();

  const showClearButton = Boolean(onClear) && Boolean(value);

  return (
    <View
      style={{
        backgroundColor: theme.colors.sand[300],
        borderRadius: theme.radius.md,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <TextInput
        style={{
          flex: 1,
          paddingVertical: 12,
          paddingLeft: 16,
          paddingRight: showClearButton ? 8 : 16,
          fontFamily: 'Manrope_500Medium',
          fontSize: 14,
          color: theme.colors.text.primary,
        }}
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
          style={{
            paddingHorizontal: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Icon size + hitSlop (10 each side) reaches theme.layout.minTouchTarget (44pt)
              without stretching the container's height beyond its original visual style. */}
          <Ionicons name="close-circle" size={theme.layout.minTouchTarget - 20} color="#9AA5AD" />
        </Pressable>
      ) : null}
    </View>
  );
}

export default SearchField;
