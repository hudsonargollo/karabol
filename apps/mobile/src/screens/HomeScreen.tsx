import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api, type QueueEntry, type YoutubeResult } from '../lib/api';
import { authStore } from '../lib/authStore';
import { crewById } from '../lib/crew';
import { BottomNav } from '../components/BottomNav';
import { MascotBlock } from '../components/MascotBlock';
import { karabol } from '../assets/karabol';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Sample-only until there's a "trending at this venue" endpoint.
const TRENDING = [
  { n: '01', title: 'Llorando se fue', artist: 'Los Kjarkas', tag: 'HOT', color: colors.lime, why: '12 veces esta semana' },
  { n: '02', title: 'De Música Ligera', artist: 'Soda Stereo', tag: 'CLASSIC', color: colors.cyan, why: 'versión original 1981' },
  { n: '03', title: 'Bohemian Rhapsody', artist: 'Queen', tag: 'EPIC', color: colors.purple, why: 'nota alta al final' },
  { n: '04', title: 'Como la flor', artist: 'Selena', tag: 'DUET', color: colors.magenta, why: '2 voces marcadas' },
  { n: '05', title: 'La Bamba', artist: 'Ritchie Valens', tag: 'PARTY', color: colors.lime, why: 'pista bailable' },
];

type Step = 0 | 1 | 2 | 3;
type Mode = 'solo' | 'duo' | 'battle';

// 02 Home — Dashboard (step 0) plus a 3-step song picker: 1 search/browse,
// 2 pick the real YouTube version (3.1 YouTube Integration), 3 confirm mode
// and add to queue.
export function HomeScreen({ route, navigation }: Props) {
  const { venueId, tableId } = route.params;
  const [name, setName] = useState('');
  const [crewImg, setCrewImg] = useState<number>(karabol.karaboyFace);
  const [myEntry, setMyEntry] = useState<{ position: number; entry: QueueEntry } | null>(null);

  const [step, setStep] = useState<Step>(0);
  const [query, setQuery] = useState('');
  const [chosenTitle, setChosenTitle] = useState('');
  const [videos, setVideos] = useState<YoutubeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [pickedVideo, setPickedVideo] = useState<YoutubeResult | null>(null);
  const [mode, setMode] = useState<Mode>('solo');
  const [status, setStatus] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    authStore.getUser().then((u) => setName(u?.displayName ?? 'Cantante'));
    authStore.getCrew().then((id) => setCrewImg(crewById(id).img));
  }, []);

  useEffect(() => {
    if (step !== 0) return;
    api
      .getQueue(venueId)
      .then((entries) => {
        const pending = entries.filter((e) => e.status === 'PENDING');
        const idx = pending.findIndex((e) => e.tableId === tableId);
        setMyEntry(idx >= 0 ? { position: idx + 1, entry: pending[idx] } : null);
      })
      .catch(() => setMyEntry(null));
  }, [step, venueId, tableId]);

  function goDash() {
    setStep(0);
  }

  function openPicker(startMode: Mode = 'solo') {
    setMode(startMode);
    setStep(1);
  }

  async function chooseTitle(title: string) {
    setChosenTitle(title);
    setStep(2);
    setSearching(true);
    setVideos(null);
    try {
      setVideos(await api.searchYoutube(title));
    } catch {
      setStatus('Búsqueda falló');
    } finally {
      setSearching(false);
    }
  }

  function pickVideo(video: YoutubeResult) {
    setPickedVideo(video);
    setStep(3);
  }

  async function confirmQueue() {
    if (!pickedVideo) return;
    setAdding(true);
    try {
      await api.queueSong({ venueId, tableId, youtubeVideoId: pickedVideo.youtubeVideoId, title: pickedVideo.title });
      navigation.replace('Queue', { venueId, tableId });
    } catch {
      setStatus('No se pudo añadir esa canción');
    } finally {
      setAdding(false);
    }
  }

  const matches = query.trim()
    ? TRENDING.filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))
    : TRENDING;

  return (
    <View style={styles.screen}>
      {step === 0 && (
        <>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MascotBlock label={name.slice(0, 2)} accent={colors.lime} size={48} source={crewImg} />
              <View>
                <Text style={styles.eyebrow}>KARAOKE NIGHT</Text>
                <Text style={styles.greeting}>Hola, {name}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.lime }]}>—</Text>
              <Text style={styles.statLabel}>PUNTOS</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.magenta }]}>—</Text>
              <Text style={styles.statLabel}>RACHA</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statNum, { color: colors.cyan }]}>—</Text>
              <Text style={styles.statLabel}>RANKING</Text>
            </View>
          </View>

          {myEntry && (
            <Pressable style={styles.turnCard} onPress={() => navigation.navigate('Queue', { venueId, tableId })}>
              <MascotBlock label="LA PARABA" accent={colors.cyan} size={52} source={karabol.parabaHero} />
              <View style={{ flex: 1 }}>
                <Text style={styles.turnLabel}>TU TURNO</Text>
                <Text style={styles.turnTitle}>#{myEntry.position} en la lista</Text>
                <Text style={styles.turnSong} numberOfLines={1}>
                  "{myEntry.entry.title}"
                </Text>
              </View>
              <Text style={styles.turnChevron}>›</Text>
            </Pressable>
          )}

          <Pressable style={styles.pickCta} onPress={() => openPicker('solo')}>
            <Image source={karabol.karaboyHero} style={styles.pickCtaImg} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pickCtaTitle}>ELEGIR CANCIÓN</Text>
              <Text style={styles.pickCtaSub}>Busca · elige versión · entra a la lista</Text>
            </View>
            <Text style={styles.pickCtaArrow}>→</Text>
          </Pressable>

          <View style={styles.dualRow}>
            <Pressable style={[styles.dualBtn, { borderColor: colors.magenta }]} onPress={() => navigation.navigate('Battle', { venueId, tableId })}>
              <Text style={[styles.dualBtnText, { color: colors.magenta }]}>⚔ RETAR A BATTLE</Text>
            </Pressable>
            <Pressable style={[styles.dualBtn, { borderColor: colors.purple }]} onPress={() => openPicker('duo')}>
              <Text style={[styles.dualBtnText, { color: colors.purple }]}>👥 PEDIR DÚO</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>HOT EN TU BAR</Text>
            <Text style={styles.aiTag}>✦ KARABOL AI</Text>
          </View>
          <FlatList
            horizontal
            data={TRENDING}
            keyExtractor={(item) => item.n}
            contentContainerStyle={styles.hotList}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable style={styles.hotCard} onPress={() => chooseTitle(item.title)}>
                <Text style={[styles.hotTag, { color: item.color, borderColor: item.color }]}>{item.tag}</Text>
                <Text style={styles.hotTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.hotArtist}>{item.artist}</Text>
              </Pressable>
            )}
          />

          <BottomNav active="Home" navigation={navigation} venueId={venueId} tableId={tableId} />
        </>
      )}

      {step > 0 && (
        <>
          <View style={styles.pickerHeader}>
            <Pressable onPress={goDash} style={styles.pickerBack}>
              <Text style={styles.pickerBackText}>‹ Inicio</Text>
            </Pressable>
            <Text style={styles.pickerTitle}>Elegir canción</Text>
            <MascotBlock label={name.slice(0, 2)} accent={colors.lime} size={34} source={crewImg} />
          </View>

          <View style={styles.progressRow}>
            <Pressable style={[styles.progressBar, { backgroundColor: step >= 1 ? colors.lime : colors.line }]} onPress={() => setStep(1)} />
            <Pressable style={[styles.progressBar, { backgroundColor: step >= 2 ? colors.lime : colors.line }]} onPress={() => videos && setStep(2)} />
            <Pressable style={[styles.progressBar, { backgroundColor: step >= 3 ? colors.lime : colors.line }]} onPress={() => pickedVideo && setStep(3)} />
          </View>
          <View style={styles.stepLabelRow}>
            <Text style={styles.stepLabel}>
              {step === 1 ? '1 · BUSCA TU CANCIÓN' : step === 2 ? '2 · ELIGE LA VERSIÓN KARAOKE' : '3 · CONFIRMA Y ENTRA A LA LISTA'}
            </Text>
            <Text style={styles.stepCount}>PASO {step} / 3</Text>
          </View>

          {step === 1 && (
            <>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>⌕</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder='Busca tu canción… "Llorando se fue"'
                  placeholderTextColor={colors.inkFaint}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => query.trim() && chooseTitle(query.trim())}
                  returnKeyType="search"
                />
              </View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{query ? 'RESULTADOS' : 'TRENDING EN TU BAR'}</Text>
                <Text style={styles.aiTag}>✦ ORDENADO POR KARABOL AI</Text>
              </View>
              <FlatList
                data={matches}
                keyExtractor={(item) => item.n}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>Sin resultados.</Text>}
                renderItem={({ item }) => (
                  <Pressable style={styles.songRow} onPress={() => chooseTitle(item.title)}>
                    <Text style={[styles.songN, { color: item.color }]}>{item.n}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.songTitle}>{item.title}</Text>
                      <Text style={styles.songMeta}>{item.artist} · {item.why}</Text>
                    </View>
                    <Text style={[styles.songTag, { color: item.color, borderColor: item.color }]}>{item.tag}</Text>
                  </Pressable>
                )}
              />
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.videoHeader}>
                <Text style={styles.videoTitle}>&quot;{chosenTitle}&quot;</Text>
                <Text style={styles.videoSub}>{searching ? 'Buscando versiones…' : `${videos?.length ?? 0} versiones karaoke en YouTube`}</Text>
              </View>
              {status && <Text style={styles.status}>{status}</Text>}
              <FlatList
                data={videos ?? []}
                keyExtractor={(item) => item.youtubeVideoId}
                contentContainerStyle={styles.list}
                ListEmptyComponent={!searching ? <Text style={styles.empty}>Sin resultados.</Text> : null}
                renderItem={({ item }) => (
                  <Pressable style={styles.videoRow} onPress={() => pickVideo(item)}>
                    {item.thumbnailUrl ? (
                      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
                    ) : (
                      <View style={[styles.thumb, styles.thumbFallback]} />
                    )}
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.rowChannel}>{item.channelTitle}</Text>
                    </View>
                  </Pressable>
                )}
              />
            </>
          )}

          {step === 3 && pickedVideo && (
            <>
              <View style={styles.confirmPreview}>
                {pickedVideo.thumbnailUrl ? (
                  <Image source={{ uri: pickedVideo.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : null}
                <Text style={styles.confirmPreviewTitle} numberOfLines={2}>{pickedVideo.title}</Text>
              </View>

              <Text style={styles.modeLabel}>¿CÓMO LA CANTAS?</Text>
              <View style={styles.modeRow}>
                {(['solo', 'duo', 'battle'] as Mode[]).map((m) => {
                  const active = mode === m;
                  const accent = m === 'solo' ? colors.lime : m === 'duo' ? colors.magenta : colors.cyan;
                  return (
                    <Pressable
                      key={m}
                      style={[styles.modeBtn, { borderColor: accent, backgroundColor: active ? accent : 'transparent' }]}
                      onPress={() => setMode(m)}
                    >
                      <Text style={[styles.modeBtnText, { color: active ? colors.limeInk : accent }]}>
                        {m === 'solo' ? 'SOLO' : m === 'duo' ? 'DÚO' : 'BATTLE'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {status && <Text style={styles.status}>{status}</Text>}
              <Pressable style={styles.confirmBtn} onPress={confirmQueue} disabled={adding}>
                <Text style={styles.confirmBtnText}>{adding ? 'AÑADIENDO…' : 'AÑADIR A LA LISTA 🎤'}</Text>
              </Pressable>
              <Pressable onPress={() => setStep(2)}>
                <Text style={styles.changeLink}>Cambiar versión</Text>
              </Pressable>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { paddingTop: spacing.xl, paddingHorizontal: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  eyebrow: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1.2, fontWeight: '600' },
  greeting: { color: colors.ink, fontSize: 22, ...type.heading },
  statsRow: { flexDirection: 'row', gap: 1, backgroundColor: colors.line, borderWidth: 1, borderColor: colors.line, marginHorizontal: spacing.xl, marginTop: spacing.md },
  statCell: { flex: 1, backgroundColor: colors.bg, padding: spacing.md, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.inkFaint, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  turnCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'rgba(46,230,255,0.35)',
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  turnLabel: { color: colors.cyan, fontSize: 10, letterSpacing: 1 },
  turnTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  turnSong: { color: colors.inkFaint, fontSize: 11 },
  turnChevron: { color: colors.inkFaint, fontSize: 22 },
  pickCta: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.lime,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  pickCtaImg: { width: 56, height: 56, borderRadius: 28 },
  pickCtaTitle: { color: colors.limeInk, fontSize: 18, fontWeight: '800', lineHeight: 20 },
  pickCtaSub: { color: '#2a3300', fontSize: 12, marginTop: 2 },
  pickCtaArrow: { color: colors.limeInk, fontSize: 24, fontWeight: '800' },
  dualRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.xl, marginTop: spacing.sm },
  dualBtn: { flex: 1, borderWidth: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  dualBtnText: { fontSize: 12, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  sectionLabel: { color: colors.inkFaint, fontSize: 12, letterSpacing: 1.2 },
  aiTag: { color: colors.purple, fontSize: 10, letterSpacing: 0.5 },
  hotList: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm },
  hotCard: { width: 140, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, padding: spacing.sm },
  hotTag: { fontSize: 10, borderWidth: 1, alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 6 },
  hotTitle: { color: colors.ink, fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
  hotArtist: { color: colors.inkFaint, fontSize: 11 },

  pickerHeader: { paddingTop: spacing.xl, paddingHorizontal: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerBack: { flexDirection: 'row', alignItems: 'center' },
  pickerBackText: { color: colors.inkFaint, fontSize: 13 },
  pickerTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  progressRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.xl, marginTop: spacing.md },
  progressBar: { flex: 1, height: 3 },
  stepLabelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  stepLabel: { color: colors.lime, fontSize: 11, letterSpacing: 1 },
  stepCount: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1 },

  searchBar: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
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
  searchInput: { color: colors.ink, fontSize: 14, flex: 1, padding: 0 },
  status: { color: colors.lime, fontSize: 13, paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: 2 },
  empty: { color: colors.inkFaint, fontSize: 14, paddingVertical: spacing.lg, textAlign: 'center' },
  songRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.line },
  songN: { fontSize: 14, fontWeight: '700', width: 22 },
  songTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  songMeta: { color: colors.inkFaint, fontSize: 12 },
  songTag: { fontSize: 11, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 8 },

  videoHeader: { paddingHorizontal: spacing.xl, marginTop: spacing.md },
  videoTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  videoSub: { color: colors.inkFaint, fontSize: 13 },
  videoRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.line },
  thumb: { width: 72, height: 54 },
  thumbFallback: { backgroundColor: colors.surface3 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  rowChannel: { color: colors.inkFaint, fontSize: 12 },

  confirmPreview: { marginHorizontal: spacing.xl, marginTop: spacing.md, height: 150, backgroundColor: colors.surface2, borderWidth: 1, borderColor: 'rgba(199,243,0,0.4)', justifyContent: 'flex-end', padding: spacing.sm, overflow: 'hidden' },
  confirmPreviewTitle: { color: colors.ink, fontSize: 13, backgroundColor: 'rgba(12,14,16,0.7)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2 },
  modeLabel: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1, marginHorizontal: spacing.xl, marginTop: spacing.md },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.xl, marginTop: spacing.sm },
  modeBtn: { flex: 1, borderWidth: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  modeBtnText: { fontSize: 12, fontWeight: '700' },
  confirmBtn: { marginHorizontal: spacing.xl, marginTop: spacing.md, backgroundColor: colors.lime, padding: spacing.md, alignItems: 'center' },
  confirmBtnText: { color: colors.limeInk, fontWeight: '800', fontSize: 15 },
  changeLink: { color: colors.inkFaint, fontSize: 12, textAlign: 'center', marginTop: spacing.sm, textDecorationLine: 'underline' },
});
