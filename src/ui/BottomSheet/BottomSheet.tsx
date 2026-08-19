import { useEffect, type PropsWithChildren } from 'react';
import {
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
}>;

const OFFSCREEN_Y = 600;

// Fallback duration when the platform does not report one with the keyboard event (Android).
const KEYBOARD_FALLBACK_DURATION = 220;

// Clearance kept between the top of the sheet and the top of the screen. A constant rather than
// `useSafeAreaInsets()` so the sheet does not require a SafeAreaProvider above it (it renders in
// its own Modal tree); it is sized to cover the tallest status bar / notch inset plus breathing
// room, and only ever matters for sheets tall enough to reach the top of the screen.
const TOP_CLEARANCE = 72;

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const theme = useTheme() as Theme;
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: visible ? 280 : 200 });
  }, [visible, progress]);

  // The sheet is absolutely positioned at the bottom of a full-screen Modal, so the iOS keyboard
  // slides right over it. Track the keyboard frame and lift the sheet by the same amount.
  useEffect(() => {
    if (!visible) {
      return;
    }

    // The sheet stays mounted between openings, so start each one flush with the bottom of the
    // screen; the listeners below lift it again if the keyboard shows up.
    keyboardHeight.value = 0;

    const applyHeight = (height: number, duration: number) => {
      keyboardHeight.value = withTiming(height, { duration });
    };

    if (Platform.OS === 'ios') {
      // `keyboardWillChangeFrame` covers show, hide and interactive dismissal in one event, and
      // carries the native animation duration so the sheet stays in sync with the keyboard.
      const subscription = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
        const screenHeight = Dimensions.get('screen').height;
        const visibleHeight = Math.max(0, screenHeight - event.endCoordinates.screenY);
        applyHeight(visibleHeight, event.duration || KEYBOARD_FALLBACK_DURATION);
      });

      return () => subscription.remove();
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      applyHeight(event.endCoordinates.height, event.duration || KEYBOARD_FALLBACK_DURATION);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', (event) => {
      applyHeight(0, event.duration || KEYBOARD_FALLBACK_DURATION);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible, keyboardHeight]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * OFFSCREEN_Y - keyboardHeight.value }],
    // Keep the sheet from growing past the top of the screen once it is lifted.
    maxHeight: windowHeight - keyboardHeight.value - TOP_CLEARANCE,
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
