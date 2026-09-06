import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { BottomNav } from '../components/BottomNav';
import { MascotBlock } from '../components/MascotBlock';
import { TypedBubble } from '../components/TypedBubble';
import { karabol } from '../assets/karabol';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Battle'>;

// 05 Battle Mode — there's no battle backend yet, so this round and its two
// contestants are a fixed local demo; only the vote tally is live state.
const ROUND = { label: 'ROUND 2 · DUELO DE CUMBIA', left: 'MARISOL', right: 'DIEGO' };

const MC_LINES = [
  'Dos voces, un trono. ¡Vota ya!',
  '¡El público nunca miente, bro!',
  'Se está poniendo bueno esto…',
  '¡Griten por su favorito!',
];

export function BattleScreen({ route, navigation }: Props) {
  const { venueId, tableId } = route.params;
  const [votePink, setVotePink] = useState(96);
  const [voteLime, setVoteLime] = useState(88);
  const [lineIdx, setLineIdx] = useState(0);
  const [pow, setPow] = useState(false);
  const total = votePink + voteLime;
  const pinkPct = Math.round((votePink / total) * 100);

  function vote(setter: (fn: (v: number) => number) => void) {
    setter((v) => v + 1);
    setPow(true);
    setTimeout(() => setPow(false), 700);
  }

  function closeVoting() {
    const winnerLabel = votePink >= voteLime ? ROUND.left : ROUND.right;
    navigation.navigate('Winner', { venueId, tableId, winnerLabel, votePink, voteLime });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.roundTag}>
        <Text style={styles.roundTagText}>{ROUND.label}</Text>
      </View>

      <Image source={karabol.standoff} style={styles.duel} resizeMode="cover" />
      <View style={styles.duelNames}>
        <Text style={[styles.sideName, { color: colors.magenta }]}>{ROUND.left}</Text>
        <Text style={[styles.sideName, { color: colors.lime }]}>{ROUND.right}</Text>
      </View>

      <View style={styles.voteSection}>
        <View style={styles.voteHeader}>
          <Text style={styles.voteLabel}>EL PÚBLICO DECIDE</Text>
          <Text style={styles.voteLabel}>{total} votos</Text>
        </View>
        <View style={styles.voteBar}>
          <View style={[styles.voteBarPink, { flex: pinkPct }]} />
          <View style={[styles.voteBarLime, { flex: 100 - pinkPct }]} />
        </View>
        <View style={styles.voteCounts}>
          <Text style={[styles.voteCount, { color: colors.magenta }]}>{votePink}</Text>
          <Text style={[styles.voteCount, { color: colors.lime }]}>{voteLime}</Text>
        </View>
      </View>

      <View style={styles.voteButtons}>
        {pow && (
          <View style={styles.powBadge}>
            <Text style={styles.powBadgeText}>¡POW!</Text>
          </View>
        )}
        <Pressable style={[styles.voteBtn, { borderColor: colors.magenta }]} onPress={() => vote(setVotePink)}>
          <Text style={[styles.voteBtnText, { color: colors.magenta }]}>🔥 {ROUND.left}</Text>
        </Pressable>
        <Pressable style={[styles.voteBtn, { borderColor: colors.lime }]} onPress={() => vote(setVoteLime)}>
          <Text style={[styles.voteBtnText, { color: colors.lime }]}>🔥 {ROUND.right}</Text>
        </Pressable>
      </View>

      <View style={styles.mcRow}>
        <MascotBlock
          label="JUCUMARI"
          accent={colors.cyan}
          size={56}
          source={karabol.bearHero}
          onTap={() => setLineIdx((n) => (n + 1) % MC_LINES.length)}
        />
        <TypedBubble
          accent={colors.cyan}
          text={MC_LINES[lineIdx]}
          style={{ flex: 1, maxWidth: undefined }}
        />
      </View>

      <Pressable style={styles.closeBtn} onPress={closeVoting}>
        <Text style={styles.closeBtnText}>CERRAR VOTACIÓN</Text>
      </Pressable>

      <BottomNav active="Battle" navigation={navigation} venueId={venueId} tableId={tableId} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  roundTag: { alignItems: 'center', paddingTop: spacing.xl },
  roundTagText: {
    color: colors.purple,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    borderWidth: 1,
    borderColor: 'rgba(216,185,255,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  duel: { width: '100%', height: 190, marginTop: spacing.md },
  duelNames: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  sideName: { fontSize: 14, fontWeight: '700' },
  voteSection: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  voteHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  voteLabel: { color: colors.inkFaint, fontSize: 12 },
  voteBar: { flexDirection: 'row', height: 14, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.line },
  voteBarPink: { backgroundColor: colors.magenta },
  voteBarLime: { backgroundColor: colors.lime },
  voteCounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  voteCount: { fontSize: 14, fontWeight: '700' },
  voteButtons: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.md, position: 'relative' },
  powBadge: {
    position: 'absolute',
    top: -18,
    left: '50%',
    marginLeft: -34,
    backgroundColor: colors.magenta,
    transform: [{ rotate: '-6deg' }],
    paddingVertical: 5,
    paddingHorizontal: 12,
    zIndex: 2,
  },
  powBadgeText: { color: colors.limeInk, fontSize: 13, fontWeight: '800', fontStyle: 'italic' },
  voteBtn: { flex: 1, borderWidth: 1, paddingVertical: spacing.md, alignItems: 'center' },
  voteBtnText: { fontSize: 14, fontWeight: '700' },
  mcRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  closeBtn: { marginHorizontal: spacing.xl, marginTop: 'auto', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.lineStrong, padding: spacing.md, alignItems: 'center' },
  closeBtnText: { color: colors.ink, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});
