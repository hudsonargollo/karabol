import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { colors } from '../theme';

const PIECES = [
  { left: 8, color: colors.lime, dur: 3200, delay: 0 },
  { left: 18, color: colors.magenta, dur: 2700, delay: 400 },
  { left: 30, color: colors.cyan, dur: 3600, delay: 900 },
  { left: 42, color: colors.purple, dur: 2900, delay: 200 },
  { left: 55, color: colors.lime, dur: 3100, delay: 1100 },
  { left: 66, color: colors.magenta, dur: 2600, delay: 600 },
  { left: 78, color: colors.cyan, dur: 3400, delay: 100 },
  { left: 90, color: colors.lime, dur: 2800, delay: 800 },
];

function ConfettiPiece({ left, color, dur, delay, height }: (typeof PIECES)[number] & { height: number }) {
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(fall, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(fall, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fall, dur, delay]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, height] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] });
  const opacity = fall.interpolate({ inputRange: [0, 0.9, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: `${left}%` as `${number}%`, backgroundColor: color, opacity, transform: [{ translateY }, { rotate }] },
      ]}
    />
  );
}

// Winner-screen confetti fall, purely decorative and self-contained.
export function Confetti({ height = 560 }: { height?: number }) {
  return (
    <>
      {PIECES.map((p, i) => (
        <ConfettiPiece key={i} {...p} height={height} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, width: 8, height: 8, zIndex: 3 },
});
