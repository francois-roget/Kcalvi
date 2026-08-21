import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useTheme } from 'styled-components/native';

import Text from '@/ui/Text';
import type { Theme } from '@/ui/theme';

import { getContainerStyle, styles } from './Toast.styles';

export type ToastProps = {
  message: string;
};

function Toast({ message }: ToastProps) {
  const theme = useTheme() as Theme;

  return (
    <Animated.View
      entering={FadeInDown.duration(180).springify().damping(20)}
      exiting={FadeOutDown.duration(180)}
      style={[styles.container, getContainerStyle(theme)]}
    >
      <Text style={styles.message}>{message}</Text>
      <View style={styles.iconWrapper}>
        <Ionicons name="checkmark" size={16} color={theme.colors.azure[400]} />
      </View>
    </Animated.View>
  );
}

export default Toast;
