import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { MascotBlock } from '../components/MascotBlock';
import { TypedBubble } from '../components/TypedBubble';
import { karabol } from '../assets/karabol';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'YourTurn'>;

const HYPE_LINES = [
  '¡Sube cuando quieras, campeón!',
  'El bar entero te está esperando.',
  '¡Dale con todo!',
];

const PREP_SECONDS = 10;

// 04 ¡Te toca! — a hype/prep beat between the queue and the live-scoring
// screen (Performance). QueueScreen lands here the moment this table's
// entry goes PLAYING; tapping "SUBIR AL MIC" is what actually starts the
// mic capture on Performance. "Pasar turno" just bails back to the queue —
// there's no patron-facing skip endpoint yet (skip is a venue-staff-only
// route), so this can't tell the server to advance the queue for you.
export function YourTurnScreen({ route, navigation }: Props) {
  const { venueId, tableId, queueEntryId, title } = route.params;
  const [lineIdx, setLineIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PREP_SECONDS);
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(bar, { toValue: 1, duration: PREP_SECONDS * 1000, useNativeDriver: false }).start();
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [bar]);

  const barWidth = bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.screen}>
      <Text style={styles.cue}>¡TE TOCA!</Text>

      <View style={styles.mascotWrap}>
        <MascotBlock
          label="SUPAY"
          accent={colors.cyan}
          size={220}
          source={karabol.diabladaHero}
          onTap={() => setLineIdx((n) => (n + 1) % HYPE_LINES.length)}
        />
        <View style={styles.otraTag}>
          <Text style={styles.otraTagText}>¡OTRA!</Text>
        </View>
        <TypedBubble accent={colors.magenta} text={HYPE_LINES[lineIdx]} style={styles.bubble} />
      </View>

      <View style={styles.songInfo}>
        <Text style={styles.songLabel}>TU CANCIÓN</Text>
        <Text style={styles.songTitle} numberOfLines={2}>
          "{title}"
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: barWidth }]} />
      </View>
      <Text style={styles.progressLabel}>
        El escenario es tuyo en <Text style={styles.progressTime}>0:{String(secondsLeft).padStart(2, '0')}</Text>
      </Text>

      <Pressable
        style={styles.micBtn}
        onPress={() => navigation.replace('Performance', { queueEntryId, venueId, tableId })}
      >
        <Text style={styles.micBtnText}>SUBIR AL MIC 🎤</Text>
      </Pressable>
      <Pressable style={styles.skipBtn} onPress={() => navigation.replace('Queue', { venueId, tableId })}>
        <Text style={styles.skipBtnText}>Pasar turno</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
  cue: {
    color: colors.magenta,
    fontSize: 34,
    textShadowColor: 'rgba(255,46,166,0.6)',
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 },
    ...type.displayItalic,
  },
  mascotWrap: { marginTop: spacing.md, position: 'relative' },
  otraTag: {
    position: 'absolute',
    bottom: 2,
    left: -12,
    backgroundColor: colors.cyan,
    transform: [{ rotate: '-8deg' }],
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  otraTagText: { color: colors.limeInk, fontSize: 15, fontWeight: '800', fontStyle: 'italic' },
  bubble: { position: 'absolute', top: 4, right: -16 },
  songInfo: { alignItems: 'center', marginTop: spacing.lg },
  songLabel: { color: colors.inkFaint, fontSize: 12, letterSpacing: 1.2 },
  songTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  progressTrack: { width: 280, height: 6, backgroundColor: colors.surface2, marginTop: spacing.lg, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.cyan },
  progressLabel: { color: colors.inkFaint, fontSize: 13, marginTop: spacing.sm },
  progressTime: { color: colors.lime, fontWeight: '700' },
  micBtn: {
    marginTop: spacing.xl,
    width: 280,
    backgroundColor: colors.lime,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  micBtnText: { color: colors.limeInk, fontFamily: 'System', fontWeight: '800', fontSize: 17 },
  skipBtn: { marginTop: spacing.sm, width: 280, borderWidth: 1, borderColor: colors.lineStrong, paddingVertical: spacing.md, alignItems: 'center' },
  skipBtnText: { color: colors.inkFaint, fontSize: 13 },
});
