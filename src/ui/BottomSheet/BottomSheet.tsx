import { useEffect, type PropsWithChildren } from 'react';
import { Modal, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
}>;

const OFFSCREEN_Y = 600;

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const theme = useTheme() as Theme;
  const { t } = useTranslation();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: visible ? 280 : 200 });
  }, [visible, progress]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * OFFSCREEN_Y }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(15,34,49,0.4)' }, overlayStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={t('common.close')} />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 18,
            paddingHorizontal: 22,
            paddingBottom: 30,
            ...theme.shadows.sheet,
          },
          sheetStyle,
        ]}
      >
        <Animated.View
          style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#E3DACB',
            alignSelf: 'center',
            marginBottom: 16,
          }}
        />
        {children}
      </Animated.View>
    </Modal>
  );
}

export default BottomSheet;
