import { useEffect, type PropsWithChildren } from 'react';
import { Modal, Pressable, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'styled-components/native';

import type { Theme } from '@/ui/theme';

import { useKeyboardLift } from './BottomSheet.helpers';
import { getSheetShadowStyle, styles, OFFSCREEN_Y, TOP_CLEARANCE } from './BottomSheet.styles';

export type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  /** Fraction of the window height the sheet should occupy at minimum (0-1).
   *  Omitted: the sheet keeps its intrinsic, content-driven height. */
  minHeightRatio?: number;
}>;

export function BottomSheet({ visible, onClose, children, minHeightRatio }: BottomSheetProps) {
  const theme = useTheme() as Theme;
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(0);
  const keyboardHeight = useKeyboardLift(visible);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: visible ? 280 : 200 });
  }, [visible, progress]);

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
      minHeight: minHeightRatio
        ? Math.min(windowHeight * minHeightRatio, availableHeight)
        : undefined,
    };
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable
          style={styles.overlayPressable}
          onPress={onClose}
          accessibilityLabel={t('common.close')}
        />
      </Animated.View>

      <Animated.View style={[styles.sheetBase, getSheetShadowStyle(theme), sheetStyle]}>
        <Animated.View style={styles.dragHandle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

export default BottomSheet;
