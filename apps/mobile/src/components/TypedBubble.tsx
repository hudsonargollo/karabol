import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = { text: string; accent: string; style?: object };

// Loops the message on a typewriter cadence with a blinking caret, matching
// the speech-bubble mascot commentary in the design.
export function TypedBubble({ text, accent, style }: Props) {
  const [shown, setShown] = useState(0);
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    const pauseTicks = 24;
    const timer = setInterval(() => {
      setShown((n) => (n + 1) % (text.length + pauseTicks));
    }, 60);
    return () => clearInterval(timer);
  }, [text]);

  useEffect(() => {
    const blink = setInterval(() => setCaretOn((v) => !v), 500);
    return () => clearInterval(blink);
  }, []);

  return (
    <View style={[styles.bubble, { borderColor: accent }, style]}>
      <Text style={styles.text} numberOfLines={3}>
        {text.slice(0, Math.min(shown, text.length))}
        <Text style={{ color: accent, opacity: caretOn ? 1 : 0 }}>▌</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: 170,
  },
  text: { color: colors.ink, fontSize: 12, lineHeight: 16 },
});
