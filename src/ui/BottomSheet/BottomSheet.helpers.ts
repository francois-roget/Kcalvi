import { useEffect } from 'react';
import { Dimensions, Keyboard } from 'react-native';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

// Fallback for the rare keyboard event that carries no animation duration of its own.
const KEYBOARD_FALLBACK_DURATION = 220;

// The sheet is absolutely positioned at the bottom of a full-screen Modal, so the keyboard
// slides right over it. Track the keyboard frame and lift the sheet by the same amount.
//
// iOS-only, deliberately: the target platform is iOS 18+ (TECHNICAL_SPECS.MD §1) and
// `keyboardWillChangeFrame` does not fire on Android. Should Android ever join the target,
// this needs an equivalent branch on `keyboardDidShow`/`keyboardDidHide` (which report
// `endCoordinates.height` rather than a frame, and only *after* the animation), plus a real
// device or emulator to validate it on -- until then the sheet simply does not lift there.
export function useKeyboardLift(visible: boolean): SharedValue<number> {
  const keyboardHeight = useSharedValue(0);

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

  return keyboardHeight;
}
