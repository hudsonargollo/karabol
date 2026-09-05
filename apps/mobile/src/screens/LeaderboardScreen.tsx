import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { MascotBlock } from '../components/MascotBlock';
import { TypedBubble } from '../components/TypedBubble';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

// 07 Leaderboard — sample-only until there's a real ranking endpoint.
const QUEEN = { name: 'Marisol', meta: '4 victorias · promedio 9.1', pts: 960 };
const RANKING = [
  { pos: 2, name: 'Diego', meta: '2 victorias · 8.8', pts: 840, accent: colors.ink },
  { pos: 3, name: 'Tú', meta: '1 victoria · 8.7', pts: 790, accent: colors.magenta },
  { pos: 4, name: 'Ana', meta: '1 victoria · 8.2', pts: 655, accent: colors.ink },
  { pos: 5, name: 'Beto', meta: '0 victorias · 7.9', pts: 580, accent: colors.ink },
  { pos: 6, name: 'Carlos', meta: '0 victorias · 7.4', pts: 515, accent: colors.ink },
];

export function LeaderboardScreen({ route }: Props) {
  void route.params;
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking</Text>
        <Text style={styles.pill}>ESTA NOCHE</Text>
      </View>

      <View style={styles.queenCard}>
        <Text style={styles.queenPos}>1</Text>
        <MascotBlock label={QUEEN.name} accent={colors.lime} size={52} />
        <View style={{ flex: 1 }}>
          <Text style={styles.queenName}>
            {QUEEN.name} <Text style={{ fontSize: 11, color: colors.lime }}>👑 REINA</Text>
          </Text>
          <Text style={styles.rowMeta}>{QUEEN.meta}</Text>
        </View>
        <Text style={styles.queenPts}>{QUEEN.pts}</Text>
      </View>

      <FlatList
        data={RANKING}
        keyExtractor={(item) => String(item.pos)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowPos}>{item.pos}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowName, { color: item.accent }]}>{item.name}</Text>
              <Text style={styles.rowMeta}>{item.meta}</Text>
            </View>
            <Text style={[styles.rowPts, { color: item.accent }]}>{item.pts}</Text>
          </View>
        )}
      />

      <View style={styles.mcRow}>
        <MascotBlock label="LA PARABA" accent={colors.cyan} size={44} />
        <TypedBubble accent={colors.cyan} text="¡Marisol sigue invicta, bro! ¿Quién se anima?" style={{ flex: 1, maxWidth: undefined }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', padding: spacing.xl, paddingBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 24, ...type.heading },
  pill: { color: colors.purple, fontSize: 12, borderWidth: 1, borderColor: 'rgba(216,185,255,0.5)', paddingVertical: 3, paddingHorizontal: 10 },
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
  rowName: { fontSize: 14, fontWeight: '600' },
  rowMeta: { color: colors.inkFaint, fontSize: 11 },
  rowPts: { fontSize: 14, fontWeight: '700' },
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
