import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SocketEvent, type QueueEntry } from '@karaokebo/shared';
import type { RootStackParamList } from '../../App';
import { api, type YoutubeResult } from '../lib/api';
import { authStore } from '../lib/authStore';
import { getSocket } from '../lib/socket';
import { Button } from '../components/Button';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

// 3.1 YouTube Integration + auto-advance to the scoring screen once this
// table's song comes up in the venue's density-based queue (3.3).
export function SearchScreen({ route, navigation }: Props) {
  const { venueId, tableId } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YoutubeResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authStore.getToken().then((token) => {
      if (!token || cancelled) return;
      const socket = getSocket(token);
      socket.emit(SocketEvent.QUEUE_JOIN, venueId);

      socket.on(SocketEvent.NOW_PLAYING, (entry: QueueEntry) => {
        if (entry.tableId === tableId) {
          navigation.navigate('Performance', { queueEntryId: entry.id, venueId });
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [venueId, tableId, navigation]);

  async function search() {
    setStatus(null);
    setSearching(true);
    try {
      setResults(await api.searchYoutube(query));
    } catch {
      setStatus('Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function queueSong(item: YoutubeResult) {
    try {
      await api.queueSong({ venueId, tableId, youtubeVideoId: item.youtubeVideoId, title: item.title });
      setStatus(`Added "${item.title}" to the queue`);
    } catch {
      setStatus('Could not add that song');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search a song"
          placeholderTextColor={colors.inkFaint}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          style={styles.input}
          // react-native-web already defaults autoComplete to "on"; `id` is
          // what Chrome actually needs to key autofill suggestions to this
          // field. No-op on native.
          id="song-search"
        />
        <Button title={searching ? '…' : 'Search'} onPress={search} disabled={!query.trim() || searching} />
      </View>

      {status && <Text style={styles.status}>{status}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item) => item.youtubeVideoId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!searching ? <Text style={styles.empty}>Search for a song to add it to the queue.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => queueSong(item)} style={styles.row} activeOpacity={0.7}>
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
          </TouchableOpacity>
        )}
      />

      <Button variant="ghost" title="My rewards" onPress={() => navigation.navigate('Wallet')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    fontSize: 15,
  },
  status: { color: colors.gold, fontSize: 13 },
  empty: { color: colors.inkFaint, fontSize: 14, paddingVertical: spacing.lg, textAlign: 'center' },
  list: { gap: spacing.sm, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  thumb: { width: 72, height: 54, borderRadius: radius.sm },
  thumbFallback: { backgroundColor: colors.surface3 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  rowChannel: { color: colors.inkFaint, fontSize: 12 },
});
