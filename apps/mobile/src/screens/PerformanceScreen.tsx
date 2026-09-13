import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EMPTY_TALLY, SocketEvent, VOTING_GRACE_SECONDS, type VoteTally } from '@karaokebo/shared';
import type { RootStackParamList } from '../../App';
import { api } from '../lib/api';
import { authStore } from '../lib/authStore';
import { getSocket } from '../lib/socket';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { MascotBlock } from '../components/MascotBlock';
import { karabol } from '../assets/karabol';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Performance'>;

// 3.4 Peer voting — the performer's screen. Shows the crowd's running tally
// while they sing (no mic capture, no DSP: the crowd is the judge) and lets
// them mark the song finished, which advances the queue and keeps their
// ballot open for a grace period so late votes still count.
export function PerformanceScreen({ route, navigation }: Props) {
  const { queueEntryId, venueId } = route.params;
  const [tally, setTally] = useState<VoteTally>(EMPTY_TALLY);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const onUpdate = (payload: { queueEntryId: string; tally: VoteTally }) => {
      if (payload.queueEntryId === queueEntryId) setTally(payload.tally);
    };

    api.getTally(queueEntryId).then((t) => !cancelled && setTally(t)).catch(() => {});
    authStore.getToken().then((token) => {
      if (!token || cancelled) return;
      const socket = getSocket(token);
      socket.emit(SocketEvent.QUEUE_JOIN, venueId);
      socket.on(SocketEvent.VOTE_UPDATE, onUpdate);
    });

    return () => {
      cancelled = true;
      authStore.getToken().then((token) => token && getSocket(token).off(SocketEvent.VOTE_UPDATE, onUpdate));
    };
  }, [queueEntryId, venueId]);

  // Mobile-driven queue: this replaces the old flow where a venue staffer
  // had to click "Complete" + "Play next" in the panel — the server marks
  // this entry done and advances the next table automatically.
  async function finishSinging() {
    setFinishing(true);
    try {
      await api.finishSong(venueId, queueEntryId);
    } catch (err) {
      console.warn('[queue] finishSong failed', err);
    } finally {
      navigation.goBack();
    }
  }

  return (
    <Screen center>
      <Text style={styles.cue}>¡TE TOCA!</Text>
      <MascotBlock
        label="TÚ"
        accent={colors.magenta}
        size={140}
        source={karabol.karaboyHero}
        style={{ marginVertical: spacing.lg }}
      />
      <Text style={styles.score}>{tally.averageVote !== null ? `★ ${tally.averageVote.toFixed(1)}` : '★ —'}</Text>
      <Text style={styles.votes}>
        {tally.voteCount === 0
          ? 'El público todavía no vota'
          : `${tally.voteCount} ${tally.voteCount === 1 ? 'voto' : 'votos'} del público`}
      </Text>
      <View style={styles.bars}>
        {tally.distribution.map((n, i) => (
          <View key={i} style={styles.barCol}>
            <View style={[styles.bar, { height: 6 + (tally.voteCount ? (n / tally.voteCount) * 40 : 0) }]} />
            <Text style={styles.barLabel}>{i + 1}★</Text>
          </View>
        ))}
      </View>
      <Text style={styles.hint}>La votación sigue abierta {VOTING_GRACE_SECONDS} s después de terminar.</Text>
      <Button title="Terminé de cantar" onPress={finishSinging} loading={finishing} disabled={finishing} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cue: {
    color: colors.magenta,
    fontSize: 34,
    textShadowColor: 'rgba(255,46,166,0.6)',
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 },
    ...type.displayItalic,
  },
  score: { color: colors.lime, fontSize: 64, fontWeight: '800' },
  votes: { color: colors.inkFaint, fontSize: 14, marginTop: -spacing.sm },
  bars: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end', marginVertical: spacing.lg, height: 64 },
  barCol: { alignItems: 'center', gap: 4, width: 32 },
  bar: { width: 18, backgroundColor: colors.lime, borderRadius: 2 },
  barLabel: { color: colors.inkFaint, fontSize: 10 },
  hint: { color: colors.inkFaint, fontSize: 12, marginBottom: spacing.md, textAlign: 'center' },
});
