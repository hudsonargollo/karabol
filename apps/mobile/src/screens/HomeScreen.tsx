import { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api, type YoutubeResult } from '../lib/api';
import { BottomNav } from '../components/BottomNav';
import { MascotBlock } from '../components/MascotBlock';
import { karabol } from '../assets/karabol';
import { colors, radius, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const CHIPS = ['CUMBIA', 'ROCK EN ESPAÑOL', '80s', 'BALADAS'];

// Sample-only until there's a "trending at this venue" endpoint — shown
// before the patron searches, replaced by real results once they do.
const TRENDING = [
  { n: '01', title: 'Llorando se fue', artist: 'Los Kjarkas', tag: 'HOT', color: colors.lime },
  { n: '02', title: 'De Música Ligera', artist: 'Soda Stereo', tag: 'CLASSIC', color: colors.cyan },
  { n: '03', title: 'Bohemian Rhapsody', artist: 'Queen', tag: 'EPIC', color: colors.purple },
  { n: '04', title: 'Como la flor', artist: 'Selena', tag: 'DUET', color: colors.magenta },
  { n: '05', title: 'La Bamba', artist: 'Ritchie Valens', tag: 'PARTY', color: colors.lime },
];

// 02 Home / Search — 3.1 YouTube Integration. Combines the venue greeting +
// genre shortcuts with the real search-and-queue flow.
export function HomeScreen({ route, navigation }: Props) {
  const { venueId, tableId } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YoutubeResult[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function search(q: string) {
    if (!q.trim()) return;
    setStatus(null);
    setSearching(true);
    try {
      setResults(await api.searchYoutube(q));
    } catch {
      setStatus('Search failed');
    } finally {
      setSearching(false);
    }
  }

  function tapChip(chip: string) {
    setQuery(chip);
    search(chip);
  }

  async function queueSong(item: YoutubeResult) {
    try {
      await api.queueSong({ venueId, tableId, youtubeVideoId: item.youtubeVideoId, title: item.title });
      setStatus(`Añadida "${item.title}" a la cola`);
    } catch {
      setStatus('No se pudo añadir esa canción');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>KARAOKE NIGHT</Text>
          <Text style={styles.greeting}>Hola</Text>
        </View>
        <MascotBlock label="TÚ" accent={colors.lime} size={44} source={karabol.karaboyFace} />
      </View>

      <Pressable style={styles.searchBar} onPress={() => search(query)}>
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchPlaceholder} numberOfLines={1}>
          {query || 'Busca tu canción… "Llorando se fue"'}
        </Text>
      </Pressable>

      <View style={styles.chipRow}>
        {CHIPS.map((chip, i) => (
          <Pressable key={chip} onPress={() => tapChip(chip)} style={[styles.chip, i === 0 && styles.chipActive]}>
            <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{chip}</Text>
          </Pressable>
        ))}
      </View>

      {status && <Text style={styles.status}>{status}</Text>}

      <Text style={styles.sectionLabel}>{results ? 'RESULTADOS' : 'TRENDING EN TU BAR'}</Text>

      {results ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.youtubeVideoId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={!searching ? <Text style={styles.empty}>Sin resultados.</Text> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => queueSong(item)} style={styles.resultRow}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]} />
              )}
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.rowChannel}>{item.channelTitle}</Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={TRENDING}
          keyExtractor={(item) => item.n}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.trendingRow} onPress={() => { setQuery(item.title); search(item.title); }}>
              <Text style={[styles.trendingN, { color: item.color }]}>{item.n}</Text>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowChannel}>{item.artist}</Text>
              </View>
              <Text style={[styles.trendingTag, { color: item.color, borderColor: item.color }]}>{item.tag}</Text>
            </Pressable>
          )}
        />
      )}

      <BottomNav active="Home" navigation={navigation} venueId={venueId} tableId={tableId} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1.2, fontWeight: '600' },
  greeting: { color: colors.ink, fontSize: 22, ...type.heading },
  searchBar: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.bg,
    borderBottomWidth: 2,
    borderBottomColor: colors.lime,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  searchIcon: { color: colors.lime, fontSize: 15 },
  searchPlaceholder: { color: colors.inkFaint, fontSize: 14, flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.md },
  chip: { paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(216,185,255,0.5)' },
  chipActive: { backgroundColor: colors.lime, borderColor: colors.lime },
  chipText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, color: colors.purple },
  chipTextActive: { color: colors.limeInk },
  status: { color: colors.lime, fontSize: 13, paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  sectionLabel: {
    color: colors.inkFaint,
    fontSize: 12,
    letterSpacing: 1.2,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: 2 },
  empty: { color: colors.inkFaint, fontSize: 14, paddingVertical: spacing.lg, textAlign: 'center' },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  trendingRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  trendingN: { fontSize: 14, fontWeight: '700', width: 20 },
  thumb: { width: 72, height: 54 },
  thumbFallback: { backgroundColor: colors.surface3 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  rowChannel: { color: colors.inkFaint, fontSize: 12 },
  trendingTag: { fontSize: 11, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 8 },
});
