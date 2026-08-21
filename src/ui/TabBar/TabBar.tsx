import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { handleTabPress } from './TabBar.helpers';
import { getContainerStyle, getLabelStyle, styles } from './TabBar.styles';

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme() as Theme;

  return (
    <View style={[styles.container, getContainerStyle(theme, insets.bottom)]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label = typeof options.title === 'string' ? options.title : route.name;
        const color = focused ? theme.colors.azure[600] : theme.colors.text.quaternary;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => handleTabPress(navigation, route, focused)}
            style={styles.tab}
          >
            {options.tabBarIcon?.({ focused, color, size: 24 })}
            <Text style={getLabelStyle(focused, color)}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default TabBar;
