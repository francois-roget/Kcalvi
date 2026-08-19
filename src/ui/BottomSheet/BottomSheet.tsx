import { useEffect, type PropsWithChildren } from 'react';
import { Dimensions, Keyboard, Modal, Pressable, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

export type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  /** Fraction of the window height the sheet should occupy at minimum (0-1).
   *  Omitted: the sheet keeps its intrinsic, content-driven height. */
  minHeightRatio?: number;
}>;

const OFFSCREEN_Y = 600;

// Fallback for the rare keyboard event that carries no animation duration of its own.
const KEYBOARD_FALLBACK_DURATION = 220;

// Clearance kept between the top of the sheet and the top of the screen. A constant rather than
// `useSafeAreaInsets()` so the sheet does not require a SafeAreaProvider above it (it renders in
// its own Modal tree); it is sized to cover the tallest status bar / notch inset plus breathing
// room, and only ever matters for sheets tall enough to reach the top of the screen.
const TOP_CLEARANCE = 72;

export function BottomSheet({ visible, onClose, children, minHeightRatio }: BottomSheetProps) {
  const theme = useTheme() as Theme;
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: visible ? 280 : 200 });
  }, [visible, progress]);

  // The sheet is absolutely positioned at the bottom of a full-screen Modal, so the keyboard
  // slides right over it. Track the keyboard frame and lift the sheet by the same amount.
  //
  // iOS-only, deliberately: the target platform is iOS 18+ (TECHNICAL_SPECS.MD §1) and
  // `keyboardWillChangeFrame` does not fire on Android. Should Android ever join the target,
  // this needs an equivalent branch on `keyboardDidShow`/`keyboardDidHide` (which report
  // `endCoordinates.height` rather than a frame, and only *after* the animation), plus a real
  // device or emulator to validate it on -- until then the sheet simply does not lift there.
  useEffect(() => {
    if (!visible) {
      return;
    }

    // The sheet stays mounted between openings, so start each one flush with the bottom of the
    // screen; the listener below lifts it again if the keyboard shows up.
    keyboardHeight.value = 0;

    // `keyboardWillChangeFrame` covers show, hide and interactive dismissal in one event, and
    // carries the native animation duration so the sheet stays in sync with the keyboard.
    const subscription = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
      const screenHeight = Dimensions.get('screen').height;
      const visibleHeight = Math.max(0, screenHeight - event.endCoordinates.screenY);
      keyboardHeight.value = withTiming(visibleHeight, {
        duration: event.duration || KEYBOARD_FALLBACK_DURATION,
      });
    });

    return () => subscription.remove();
  }, [visible, keyboardHeight]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => {
    // `keyboardHeight` is a shared value, so the minHeight bound has to be computed here, inside
    // the worklet, rather than hoisted into a plain JS constant that would miss keyboard updates.
    const availableHeight = windowHeight - keyboardHeight.value - TOP_CLEARANCE;

    return {
      transform: [{ translateY: (1 - progress.value) * OFFSCREEN_Y - keyboardHeight.value }],
      // Keep the sheet from growing past the top of the screen once it is lifted.
      maxHeight: availableHeight,
      // Optionally enforce a minimum height so sparse content doesn't collapse the sheet, capped
      // by the same keyboard-aware clearance used for `maxHeight`.
      minHeight: minHeightRatio ? Math.min(windowHeight * minHeightRatio, availableHeight) : undefined,
    };
  });

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
