import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme() as Theme;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.sand[100],
        borderTopWidth: 1,
        borderTopColor: theme.colors.sand[400],
        paddingTop: 11,
        paddingBottom: Math.max(insets.bottom, 24),
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label = typeof options.title === 'string' ? options.title : route.name;
        const color = focused ? theme.colors.azure[600] : theme.colors.text.quaternary;

        function onPress() {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', gap: 4 }}
          >
            {options.tabBarIcon?.({ focused, color, size: 24 })}
            <Text
              style={{
                fontSize: 11,
                fontFamily: focused ? 'Manrope_700Bold' : 'Manrope_600SemiBold',
                color,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default TabBar;
