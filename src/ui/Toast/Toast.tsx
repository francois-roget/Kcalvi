import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

export type ToastProps = {
  message: string;
};

export function Toast({ message }: ToastProps) {
  const theme = useTheme() as Theme;

  return (
    <Animated.View
      entering={FadeInDown.duration(180).springify().damping(20)}
      exiting={FadeOutDown.duration(180)}
      style={{
        position: 'absolute',
        left: 22,
        right: 22,
        bottom: 114,
        backgroundColor: theme.colors.ink[800],
        borderRadius: theme.radius.lg,
        paddingVertical: 13,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text
        style={{ color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 13, flexShrink: 1 }}
      >
        {message}
      </Text>
      <View style={{ marginLeft: 12 }}>
        <Ionicons name="checkmark" size={16} color={theme.colors.azure[400]} />
      </View>
    </Animated.View>
  );
}

export default Toast;
