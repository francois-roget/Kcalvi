import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import type { ProgressStackParamList } from '@/navigation/types';

import { ProgressScreen } from './screens/ProgressScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export function ProgressNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      <Stack.Screen name="Progress" options={{ headerShown: false }} component={ProgressScreen} />
      <Stack.Screen
        name="Profile"
        options={{ title: t('tabs.profile') }}
        component={ProfileScreen}
      />
    </Stack.Navigator>
  );
}
