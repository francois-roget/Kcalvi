import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { styles } from './ListRow.styles';

export type ListRowLabelProps = {
  theme: Theme;
  label: string;
  sublabel?: string;
  selected: boolean;
};

/** Left-hand side of a ListRow: the selection checkmark, label and optional sublabel. */
function ListRowLabel({ theme, label, sublabel, selected }: ListRowLabelProps) {
  return (
    <View style={styles.labelGroup}>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={18}
          color={theme.colors.azure[600]}
          style={styles.checkmarkIcon}
          accessible={false}
          importantForAccessibility="no"
        />
      )}
      <View style={styles.labelTextWrapper}>
        <Text
          variant="body"
          color={selected ? 'text.accent' : 'text.primary'}
          style={selected ? styles.selectedLabel : undefined}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text variant="caption" color="text.tertiary" style={styles.sublabel}>
            {sublabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default ListRowLabel;
