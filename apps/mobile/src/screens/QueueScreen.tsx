import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SocketEvent } from '@karaokebo/shared';
import type { RootStackParamList } from '../../App';
import { api, type QueueEntry } from '../lib/api';
import { authStore } from '../lib/authStore';
import { getSocket } from '../lib/socket';
import { BottomNav } from '../components/BottomNav';
import { MascotBlock } from '../components/MascotBlock';
import { EqBars } from '../components/EqBars';
import { karabol } from '../assets/karabol';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Queue'>;

// 03 La Cola — 3.2/3.3 live queue view. Auto-advances to the scoring screen
// when this table's entry starts playing.
export function QueueScreen({ route, navigation }: Props) {
  const { venueId, tableId } = route.params;
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [nowPlaying, setNowPlaying] = useState<QueueEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function refresh() {
      api
        .getQueue(venueId)
        .then((data) => !cancelled && setEntries(data))
        .catch(() => !cancelled && setError('No se pudo cargar la cola'));
    }
    refresh();

    authStore.getToken().then((token) => {
      if (!token || cancelled) return;
      const socket = getSocket(token);
      socket.emit(SocketEvent.QUEUE_JOIN, venueId);
      socket.on(SocketEvent.QUEUE_STATE, refresh);
      socket.on(SocketEvent.NOW_PLAYING, (entry: QueueEntry) => {
        setNowPlaying(entry);
        if (entry.tableId === tableId) {
          navigation.navigate('Performance', { queueEntryId: entry.id, venueId, tableId });
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [venueId, tableId, navigation]);

  const upcoming = entries.filter((e) => e.status === 'PENDING');

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>
          La Cola <Text style={{ color: colors.lime }}>· {upcoming.length}</Text>
        </Text>
        <Text style={styles.sub}>Mesa {tableId}</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {nowPlaying && (
        <View style={styles.nowCard}>
          <MascotBlock label="LA PARABA" accent={colors.cyan} size={72} source={karabol.parabaHero} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nowLabel}>AHORA CANTA</Text>
            <Text style={styles.nowTitle} numberOfLines={2}>
              Mesa {nowPlaying.tableId} · "{nowPlaying.title}"
            </Text>
            <View style={{ marginTop: spacing.xs }}>
              <EqBars />
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>SIGUIENTES</Text>
      <FlatList
        data={upcoming}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Nadie en la cola todavía.</Text>}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={[styles.pos, index === 0 && { color: colors.lime }]}>{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                Mesa {item.tableId}
              </Text>
              <Text style={styles.rowSong} numberOfLines={1}>
                "{item.title}"
              </Text>
            </View>
          </View>
        )}
      />

      <View style={styles.actions}>
        <Pressable style={styles.joinBtn} onPress={() => navigation.replace('Home', { venueId, tableId })}>
          <Text style={styles.joinBtnText}>+ UNIRME A LA COLA</Text>
        </Pressable>
        <Pressable style={styles.rankBtn} onPress={() => navigation.navigate('Leaderboard', { venueId, tableId })}>
          <Text style={styles.rankBtnText}>⇅</Text>
        </Pressable>
      </View>

      <BottomNav active="Queue" navigation={navigation} venueId={venueId} tableId={tableId} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { paddingTop: spacing.xl, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 24, ...type.heading },
  sub: { color: colors.inkFaint, fontSize: 13, marginTop: 2 },
  error: { color: colors.danger, fontSize: 13, paddingHorizontal: spacing.xl },
  nowCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  nowLabel: { color: colors.cyan, fontSize: 11, letterSpacing: 1 },
  nowTitle: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 2 },
  sectionLabel: { color: colors.inkFaint, fontSize: 12, letterSpacing: 1.2, paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  empty: { color: colors.inkFaint, fontSize: 14, paddingVertical: spacing.lg, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pos: { color: colors.inkFaint, fontSize: 14, fontWeight: '700', width: 20 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  rowSong: { color: colors.inkFaint, fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.xl, paddingTop: spacing.md },
  joinBtn: { flex: 1, backgroundColor: colors.lime, padding: spacing.md, alignItems: 'center' },
  joinBtnText: { color: colors.limeInk, fontWeight: '800', fontSize: 14 },
  rankBtn: { borderWidth: 1, borderColor: 'rgba(216,185,255,0.5)', paddingHorizontal: spacing.lg, justifyContent: 'center' },
  rankBtnText: { color: colors.purple, fontWeight: '700', fontSize: 16 },
});
