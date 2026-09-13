import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SocketEvent, VOTE_MAX, VOTE_MIN, type VoteTally } from '@karaokebo/shared';
import type { RootStackParamList } from '../../App';
import { api, type OpenPerformance, type QueueEntry } from '../lib/api';
import { authStore } from '../lib/authStore';
import { getSocket } from '../lib/socket';
import { BottomNav } from '../components/BottomNav';
import { MascotBlock } from '../components/MascotBlock';
import { karabol } from '../assets/karabol';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Vote'>;

const STARS = Array.from({ length: VOTE_MAX - VOTE_MIN + 1 }, (_, i) => VOTE_MIN + i);

// 3.4 Peer voting — the crowd's ballot. One tap per star; re-tapping changes
// the vote until the window closes. The performer sees the same tally live
// on their PerformanceScreen; the TV board shows it as a meter.
export function VoteScreen({ route, navigation }: Props) {
  const { venueId, tableId } = route.params;
  const [open, setOpen] = useState<OpenPerformance | null>(null);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<number | null>(null);

  const reload = useCallback(() => {
    api
      .getOpenPerformance(venueId)
      .then((data) => {
        setOpen(data);
        setClosed(false);
        setError(null);
      })
      .catch(() => setError('No se pudo cargar la actuación'));
  }, [venueId]);

  useEffect(() => {
    reload();
    let cancelled = false;
    const onOpen = () => reload();
    const onUpdate = (p: { queueEntryId: string; tally: VoteTally }) =>
      setOpen((cur) => (cur?.entry && cur.entry.id === p.queueEntryId ? { ...cur, tally: p.tally } : cur));
    const onFinal = (p: { queueEntryId: string; tally: VoteTally }) => {
      setOpen((cur) => (cur?.entry && cur.entry.id === p.queueEntryId ? { ...cur, tally: p.tally } : cur));
      setClosed(true);
    };

    authStore.getToken().then((token) => {
      if (!token || cancelled) return;
      const socket = getSocket(token);
      socket.emit(SocketEvent.QUEUE_JOIN, venueId);
      socket.on(SocketEvent.VOTE_OPEN, onOpen);
      socket.on(SocketEvent.NOW_PLAYING, onOpen);
      socket.on(SocketEvent.VOTE_UPDATE, onUpdate);
      socket.on(SocketEvent.VOTE_FINAL, onFinal);
    });

    return () => {
      cancelled = true;
      authStore.getToken().then((token) => {
        if (!token) return;
        const socket = getSocket(token);
        socket.off(SocketEvent.VOTE_OPEN, onOpen);
        socket.off(SocketEvent.NOW_PLAYING, onOpen);
        socket.off(SocketEvent.VOTE_UPDATE, onUpdate);
        socket.off(SocketEvent.VOTE_FINAL, onFinal);
      });
    };
  }, [venueId, reload]);

  async function vote(value: number) {
    if (!open?.entry) return;
    setSending(value);
    setError(null);
    try {
      const tally = await api.castVote(open.entry.id, value);
      setOpen({ ...open, tally, myVote: value });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('409') ? 'La votación ya cerró' : msg.includes('403') ? 'No puedes votarte a ti mismo' : 'No se pudo enviar tu voto');
    } finally {
      setSending(null);
    }
  }

  const entry: QueueEntry | null = open?.entry ?? null;
  const tally = open?.tally ?? null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Vota</Text>
        <Text style={styles.sub}>Mesa {tableId}</Text>
      </View>

      {!entry ? (
        <View style={styles.center}>
          <MascotBlock label="LA PARABA" accent={colors.cyan} size={96} source={karabol.parabaHero} />
          <Text style={styles.empty}>Nadie está cantando ahora mismo.</Text>
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.nowLabel}>{closed ? 'VOTACIÓN CERRADA' : 'AHORA CANTA'}</Text>
          <Text style={styles.nowTitle} numberOfLines={2}>
            Mesa {entry.tableId} · "{entry.title}"
          </Text>

          {open?.isMine ? (
            <Text style={styles.notice}>Es tu actuación — el público te vota a ti 🎤</Text>
          ) : (
            <View style={styles.stars}>
              {STARS.map((n) => {
                const chosen = (open?.myVote ?? 0) >= n;
                return (
                  <Pressable
                    key={n}
                    disabled={closed || sending !== null}
                    onPress={() => vote(n)}
                    style={({ pressed }) => [styles.star, pressed && { opacity: 0.6 }]}
                  >
                    <Text style={[styles.starGlyph, chosen && styles.starChosen]}>{chosen ? '★' : '☆'}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {open?.myVote && !open.isMine && (
            <Text style={styles.myVote}>{closed ? `Votaste ${open.myVote}★` : `Tu voto: ${open.myVote}★ · toca otra estrella para cambiarlo`}</Text>
          )}
          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.tallyCard}>
            <Text style={styles.tallyBig}>{tally?.averageVote !== null && tally ? `★ ${tally.averageVote.toFixed(1)}` : '★ —'}</Text>
            <Text style={styles.tallySub}>
              {tally?.voteCount ? `${tally.voteCount} ${tally.voteCount === 1 ? 'voto' : 'votos'}` : 'Sé el primero en votar'}
            </Text>
          </View>
        </View>
      )}

      <BottomNav active="Queue" navigation={navigation} venueId={venueId} tableId={tableId} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { paddingTop: spacing.xl, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 24, ...type.heading },
  sub: { color: colors.inkFaint, fontSize: 13, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  empty: { color: colors.inkFaint, fontSize: 14 },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },
  nowLabel: { color: colors.cyan, fontSize: 11, letterSpacing: 1 },
  nowTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  notice: { color: colors.inkFaint, fontSize: 14, marginTop: spacing.md },
  stars: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  star: { padding: spacing.xs },
  starGlyph: { fontSize: 44, color: colors.inkFaint },
  starChosen: { color: colors.lime },
  myVote: { color: colors.inkFaint, fontSize: 12, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  tallyCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    alignItems: 'center',
  },
  tallyBig: { color: colors.lime, fontSize: 40, fontWeight: '800' },
  tallySub: { color: colors.inkFaint, fontSize: 13, marginTop: 4 },
});
