import { Ionicons } from '@expo/vector-icons';
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
}: ListRowProps) {
  const theme = useTheme() as Theme;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 44,
        paddingVertical: 13,
        paddingHorizontal: 18,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.border.subtle,
      }}
    >
      <View style={{ flexShrink: 1, paddingRight: 12 }}>
        <Text variant="body">{label}</Text>
        {sublabel ? (
          <Text variant="caption" color="text.tertiary" style={{ marginTop: 2 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? <Text variant="body">{value}</Text> : null}
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
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

export default ListRow;
