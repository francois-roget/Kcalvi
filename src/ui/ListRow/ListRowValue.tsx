import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';
import Toggle from '@/ui/Toggle';

import type { ListRowAccessory } from './ListRow';
import { getAccessoryStarColor, getStarColor, styles } from './ListRow.styles';

export type ListRowValueProps = {
  theme: Theme;
  value?: string;
  stars?: number;
  maxStars: number;
  selected: boolean;
  accessory?: ListRowAccessory;
  accessoryValue: boolean;
  onAccessoryChange?: (value: boolean) => void;
  starsAccessibilityLabel?: string;
};

/** Right-hand side of a ListRow: either a star rating or a value label, plus the accessory icon. */
export function ListRowValue({
  theme,
  value,
  stars,
  maxStars,
  selected,
  accessory,
  accessoryValue,
  onAccessoryChange,
  starsAccessibilityLabel,
}: ListRowValueProps) {
  return (
    <View style={styles.valueGroup}>
      {stars !== undefined ? (
        <View style={styles.starsRow} accessible accessibilityLabel={starsAccessibilityLabel}>
          {Array.from({ length: maxStars }, (_, index) => (
            <Ionicons
              key={index}
              name={index < stars ? 'star' : 'star-outline'}
              size={16}
              color={getStarColor(theme, index < stars, selected)}
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
          color={getAccessoryStarColor(theme, accessoryValue)}
        />
      )}
      {accessory === 'toggle' && (
        <Toggle value={accessoryValue} onValueChange={onAccessoryChange ?? (() => {})} />
      )}
    </View>
  );
}

export default ListRowValue;
