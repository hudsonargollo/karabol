import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

type Props = {
  label: string;
  accent: string;
  size?: number;
  onTap?: () => void;
  style?: object;
};

// Placeholder for the KARABOL mascot artwork (final PNGs not yet wired in).
// Idle-bobs continuously; tapping fires a quick pop + the caller's onTap
// (used to cycle "poses" once real art is in place).
export function MascotBlock({ label, accent, size = 96, onTap, style }: Props) {
  const bob = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -10, duration: 1300, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  function handlePress() {
    Animated.sequence([
      Animated.timing(pop, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onTap?.();
  }

  const content = (
    <Animated.View
      style={[
        styles.box,
        { width: size, height: size, borderColor: accent, transform: [{ translateY: bob }, { scale: pop }] },
        style,
      ]}
    >
      <Text style={[styles.label, { color: accent }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );

  if (!onTap) return content;
  return <Pressable onPress={handlePress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
});
