import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const BAR_COLORS = [colors.lime, colors.magenta, colors.cyan, colors.purple, colors.lime];

// Small animated "now playing" equalizer, purely decorative.
export function EqBars({ height = 18, barWidth = 4 }: { height?: number; barWidth?: number }) {
  const values = useRef(BAR_COLORS.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: 500 + i * 80, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 500 + i * 80, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [values]);

  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: barWidth,
            height: '100%',
            backgroundColor: BAR_COLORS[i],
            transform: [{ scaleY: v }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, alignItems: 'flex-end' },
});
