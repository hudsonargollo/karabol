import { useEffect, useState } from 'react';
import { Button, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SocketEvent, type QueueEntry } from '@karaokebo/shared';
import type { RootStackParamList } from '../../App';
import { api, type YoutubeResult } from '../lib/api';
import { authStore } from '../lib/authStore';
import { getSocket } from '../lib/socket';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

// 3.1 YouTube Integration + auto-advance to the scoring screen once this
// table's song comes up in the venue's density-based queue (3.3).
export function SearchScreen({ route, navigation }: Props) {
  const { venueId, tableId } = route.params;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YoutubeResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);

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
    try {
      setResults(await api.searchYoutube(query));
    } catch {
      setStatus('Search failed');
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
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          placeholder="Search a song"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          style={{ flex: 1, borderWidth: 1, padding: 8 }}
        />
        <Button title="Search" onPress={search} />
      </View>

      {status && <Text>{status}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item) => item.youtubeVideoId}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => queueSong(item)}
            style={{ flexDirection: 'row', gap: 8, paddingVertical: 8, alignItems: 'center' }}
          >
            {item.thumbnailUrl && <Image source={{ uri: item.thumbnailUrl }} style={{ width: 60, height: 45 }} />}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2}>{item.title}</Text>
              <Text style={{ color: '#666', fontSize: 12 }}>{item.channelTitle}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Button title="My rewards" onPress={() => navigation.navigate('Wallet')} />
    </View>
  );
}
