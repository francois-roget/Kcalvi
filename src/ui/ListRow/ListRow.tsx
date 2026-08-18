import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import Toggle from '@/ui/Toggle';

export type ListRowAccessory = 'chevron' | 'toggle' | 'star';

export type ListRowProps = {
  label: string;
  value?: string;
  sublabel?: string;
  accessory?: ListRowAccessory;
  accessoryValue?: boolean;
  onAccessoryChange?: (value: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
  /** Highlights the value (e.g. selected option in a choice list). */
  selected?: boolean;
  /** Displays a star rating (out of `maxStars`, default 4) instead of `value`. */
  stars?: number;
  maxStars?: number;
};

export function ListRow({
  label,
  value,
  sublabel,
  accessory,
  accessoryValue = false,
  onAccessoryChange,
  onPress,
  isLast,
  selected = false,
  stars,
  maxStars = 4,
}: ListRowProps) {
  const theme = useTheme() as Theme;
  const { t } = useTranslation();

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 44,
        paddingVertical: 13,
        paddingHorizontal: 18,
        backgroundColor: selected ? theme.colors.azure[50] : 'transparent',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.border.subtle,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, paddingRight: 12 }}>
        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={theme.colors.azure[600]}
            style={{ marginRight: 8 }}
            accessible={false}
            importantForAccessibility="no"
          />
        )}
        <View style={{ flexShrink: 1 }}>
          <Text
            variant="body"
            color={selected ? 'text.accent' : 'text.primary'}
            style={selected ? { fontFamily: 'Manrope_700Bold' } : undefined}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text variant="caption" color="text.tertiary" style={{ marginTop: 2 }}>
              {sublabel}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {stars !== undefined ? (
          <View
            style={{ flexDirection: 'row', gap: 2 }}
            accessible
            accessibilityLabel={t('common.starsRating', { count: stars, max: maxStars })}
          >
            {Array.from({ length: maxStars }, (_, index) => (
              <Ionicons
                key={index}
                name={index < stars ? 'star' : 'star-outline'}
                size={16}
                color={
                  index < stars
                    ? selected
                      ? theme.colors.azure[600]
                      : theme.colors.text.secondary
                    : theme.colors.text.disabled
                }
                importantForAccessibility="no"
              />
            ))}
          </View>
        ) : value ? (
          <Text variant="body" color={selected ? 'text.accent' : 'text.primary'}>
            {value}
          </Text>
        ) : null}
        {accessory === 'chevron' && (
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text.disabled} />
        )}
        {accessory === 'star' && (
          <Ionicons
            name={accessoryValue ? 'star' : 'star-outline'}
            size={18}
            color={accessoryValue ? theme.colors.azure[400] : theme.colors.text.disabled}
          />
        )}
        {accessory === 'toggle' && (
          <Toggle value={accessoryValue} onValueChange={onAccessoryChange ?? (() => {})} />
        )}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      {content}
    </Pressable>
  );
}

export default ListRow;
