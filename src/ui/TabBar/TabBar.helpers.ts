import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type TabBarNavigation = BottomTabBarProps['navigation'];
type TabBarRoute = BottomTabBarProps['state']['routes'][number];

/** Emits the navigation `tabPress` event and navigates unless it was already focused or prevented. */
export function handleTabPress(
  navigation: TabBarNavigation,
  route: TabBarRoute,
  focused: boolean,
): void {
  const event = navigation.emit({
    type: 'tabPress',
    target: route.key,
    canPreventDefault: true,
  });
  if (!focused && !event.defaultPrevented) {
    navigation.navigate(route.name);
  }
}
