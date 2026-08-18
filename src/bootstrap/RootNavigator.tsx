import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { profileRepository } from '@/data/repositories';
import type { UserProfile } from '@/domain/types';
import { JournalNavigator } from '@/features/journal/navigation';
import { LibraryNavigator } from '@/features/library/navigation';
import { OnboardingNavigator } from '@/features/profile/navigation';
import { ProgressNavigator } from '@/features/progress/navigation';
import { TodayNavigator } from '@/features/today/navigation';
import { useObservable } from '@/hooks/useObservable';
import type { RootTabParamList } from '@/navigation/types';
import TabBar from '@/ui/TabBar';

import { ErrorBoundary } from '@/bootstrap/providers';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  TodayTab: 'today-outline',
  JournalTab: 'book-outline',
  LibraryTab: 'restaurant-outline',
  ProgressTab: 'stats-chart-outline',
};

function withErrorBoundary(Navigator: ComponentType) {
  return function BoundedNavigator() {
    return (
      <ErrorBoundary>
        <Navigator />
      </ErrorBoundary>
    );
  };
}

const BoundedTodayNavigator = withErrorBoundary(TodayNavigator);
const BoundedJournalNavigator = withErrorBoundary(JournalNavigator);
const BoundedLibraryNavigator = withErrorBoundary(LibraryNavigator);
const BoundedProgressNavigator = withErrorBoundary(ProgressNavigator);

export function RootNavigator() {
  const { t } = useTranslation();
  const profileObservable = useMemo(() => profileRepository.observe(), []);
  const profile = useObservable<UserProfile | null | undefined>(profileObservable, undefined);

  return (
    <NavigationContainer>
      {profile === undefined ? null : profile === null ? (
        <OnboardingNavigator />
      ) : (
        <Tab.Navigator
          tabBar={(props) => <TabBar {...props} />}
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
            ),
          })}
        >
          <Tab.Screen
            name="TodayTab"
            component={BoundedTodayNavigator}
            options={{ title: t('tabs.today') }}
          />
          <Tab.Screen
            name="JournalTab"
            component={BoundedJournalNavigator}
            options={{ title: t('tabs.journal') }}
          />
          <Tab.Screen
            name="LibraryTab"
            component={BoundedLibraryNavigator}
            options={{ title: t('tabs.library') }}
          />
          <Tab.Screen
            name="ProgressTab"
            component={BoundedProgressNavigator}
            options={{ title: t('tabs.progress') }}
          />
        </Tab.Navigator>
      )}
    </NavigationContainer>
  );
}
