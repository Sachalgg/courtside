import { ReactNode, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleProp, ViewStyle } from 'react-native';

const native = Platform.OS !== 'web';

/** Fades and lifts its content in, staggered by `index`. Skipped when the system asks for reduced motion. */
export function FadeIn({ children, index = 0, style }: { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (!alive) return;
        if (reduce) v.setValue(1);
        else
          Animated.timing(v, { toValue: 1, duration: 320, delay: Math.min(index, 8) * 40, useNativeDriver: native }).start();
      });
    return () => {
      alive = false;
    };
  }, [v, index]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
      ]}>
      {children}
    </Animated.View>
  );
}
