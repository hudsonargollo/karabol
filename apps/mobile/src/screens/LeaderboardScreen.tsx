import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api, type LeaderboardRow } from '../lib/api';
import { MascotBlock } from '../components/MascotBlock';
import { TypedBubble } from '../components/TypedBubble';
import { karabol } from '../assets/karabol';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

// 07 Leaderboard — real ranking from GET /venues/:id/leaderboard (points =
// sum of tonight's Scores). No per-user mascot/avatar here (crew pick isn't
// tied to this row server-side) or "victorias" (no Battle model yet) — the
// meta line shows the one real thing we have: songs sung tonight.
export function LeaderboardScreen({ route }: Props) {
  const { venueId } = route.params;
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    api
      .getLeaderboard(venueId)
      .then(setRows)
      .catch(() => setRows([]));
  }, [venueId]);

  const [queen, ...rest] = rows ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking</Text>
        <Text style={styles.pill}>ESTA NOCHE</Text>
      </View>

      {rows === null ? (
        <Text style={styles.empty}>Cargando…</Text>
      ) : queen ? (
        <>
          <View style={styles.queenCard}>
            <Text style={styles.queenPos}>1</Text>
            <MascotBlock label={queen.displayName ?? '?'} accent={colors.lime} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.queenName}>
                {queen.displayName ?? 'Cantante'} <Text style={{ fontSize: 11, color: colors.lime }}>👑 REINA</Text>
              </Text>
              <Text style={styles.rowMeta}>{queen.songs} {queen.songs === 1 ? 'canción' : 'canciones'} hoy</Text>
            </View>
            <Text style={styles.queenPts}>{queen.points}</Text>
          </View>

          <FlatList
            data={rest}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <View style={styles.row}>
                <Text style={styles.rowPos}>{index + 2}</Text>
                <MascotBlock label={item.displayName ?? '?'} accent={colors.ink} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{item.displayName ?? 'Cantante'}</Text>
                  <Text style={styles.rowMeta}>{item.songs} {item.songs === 1 ? 'canción' : 'canciones'} hoy</Text>
                </View>
                <Text style={styles.rowPts}>{item.points}</Text>
              </View>
            )}
          />
        </>
      ) : (
        <Text style={styles.empty}>Nadie ha cantado todavía esta noche.</Text>
      )}

      <View style={styles.mcRow}>
        <MascotBlock label="LA PARABA" accent={colors.cyan} size={44} source={karabol.parabaHero} />
        <TypedBubble accent={colors.cyan} text="¿Quién se anima a subir al trono esta noche?" style={{ flex: 1, maxWidth: undefined }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', padding: spacing.xl, paddingBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 24, ...type.heading },
  pill: { color: colors.purple, fontSize: 12, borderWidth: 1, borderColor: 'rgba(216,185,255,0.5)', paddingVertical: 3, paddingHorizontal: 10 },
  empty: { color: colors.inkFaint, fontSize: 14, textAlign: 'center', marginTop: spacing.xl },
  queenCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: 'rgba(199,243,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(199,243,0,0.4)',
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  queenPos: { color: colors.lime, fontSize: 26, fontWeight: '800' },
  queenName: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  queenPts: { color: colors.lime, fontSize: 18, fontWeight: '800' },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowPos: { color: colors.inkFaint, fontSize: 14, fontWeight: '700', width: 20 },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowMeta: { color: colors.inkFaint, fontSize: 11 },
  rowPts: { fontSize: 14, fontWeight: '700', color: colors.ink },
  mcRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    margin: spacing.xl,
    marginTop: spacing.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
});
