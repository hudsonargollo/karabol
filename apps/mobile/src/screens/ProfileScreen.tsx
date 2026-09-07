import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api, type UserStats } from '../lib/api';
import { authStore } from '../lib/authStore';
import { crewById } from '../lib/crew';
import { BottomNav } from '../components/BottomNav';
import { MascotBlock } from '../components/MascotBlock';
import { TypedBubble } from '../components/TypedBubble';
import { karabol } from '../assets/karabol';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const CREW = [
  { label: 'Diablada', accent: colors.magenta, img: karabol.diabladaHero },
  { label: 'Alpacho', accent: colors.lime, img: karabol.alpachoHero },
  { label: 'Jucumari', accent: colors.cyan, img: karabol.bearHero },
  { label: 'Paraba', accent: colors.purple, img: karabol.parabaHero },
];

// 08 Perfil — real display name from auth. CANCIONES/PROMEDIO come from
// GET /users/me/stats (real Score/QueueEntry data); BATTLES stays a dash —
// there's no Battle model yet (BattleScreen is still a fixed local demo),
// so that stat would have to be invented. "Bio" is local-only (no
// profile-update endpoint yet), but genuinely editable.
export function ProfileScreen({ route, navigation }: Props) {
  const { venueId, tableId } = route.params;
  const [name, setName] = useState('');
  const [crewName, setCrewName] = useState<string | null>(null);
  const [bio, setBio] = useState('Karaoke es vida, bro…');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    authStore.getUser().then((u) => setName(u?.displayName ?? 'Cantante'));
    authStore.getCrew().then((id) => setCrewName(id ? crewById(id).name : null));
    api.getMyStats().then(setStats).catch(() => setStats(null));
  }, []);

  async function logout() {
    await authStore.clear();
    navigation.replace('Auth');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.banner}>
        <Image source={karabol.houseparty} style={styles.bannerImg} resizeMode="cover" />
        <TypedBubble accent={colors.purple} text={bio} style={styles.bannerBubble} />
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{name}</Text>
          {crewName && <Text style={styles.crewLine}>Team {crewName}</Text>}
          {editing ? (
            <TextInput
              style={styles.bioInput}
              value={draft}
              onChangeText={setDraft}
              autoFocus
              onSubmitEditing={() => {
                setBio(draft);
                setEditing(false);
              }}
            />
          ) : (
            <Text style={styles.bio}>{bio}</Text>
          )}
        </View>
        <MascotBlock label={name.slice(0, 2) || '?'} accent={colors.purple} size={56} source={karabol.karaboyFace} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text style={styles.statNum}>{stats ? stats.songsCompleted : '—'}</Text>
          <Text style={styles.statLabel}>CANCIONES</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statNum}>—</Text>
          <Text style={styles.statLabel}>BATTLES</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statNum}>{stats?.averageScore ?? '—'}</Text>
          <Text style={styles.statLabel}>PROMEDIO</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>CREW</Text>
      <View style={styles.crewRow}>
        {CREW.map((m) => (
          <MascotBlock key={m.label} label={m.label} accent={m.accent} size={72} source={m.img} />
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.editBtn}
          onPress={() => {
            if (editing) {
              setBio(draft);
              setEditing(false);
            } else {
              setDraft(bio);
              setEditing(true);
            }
          }}
        >
          <Text style={styles.editBtnText}>{editing ? 'GUARDAR' : 'EDITAR PERFIL'}</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('Wallet')}>
          <Text style={styles.linkBtnText}>Ver mis premios</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={logout}>
          <Text style={[styles.linkBtnText, { color: colors.danger }]}>Cerrar sesión</Text>
        </Pressable>
      </View>

      <BottomNav active="Profile" navigation={navigation} venueId={venueId} tableId={tableId} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  banner: { margin: spacing.xl, marginBottom: 0, height: 180, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg },
  bannerImg: { width: '100%', height: '100%' },
  bannerBubble: { position: 'absolute', bottom: 10, left: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  name: { color: colors.ink, fontSize: 22, ...type.heading },
  crewLine: { color: colors.purple, fontSize: 12, fontWeight: '600', marginTop: 2 },
  bio: { color: colors.inkFaint, fontSize: 13, marginTop: 2 },
  bioInput: { color: colors.ink, fontSize: 13, marginTop: 2, borderBottomWidth: 1, borderBottomColor: colors.lime, minWidth: 180 },
  statsGrid: { flexDirection: 'row', gap: 1, backgroundColor: colors.line, marginHorizontal: spacing.xl },
  statCell: { flex: 1, backgroundColor: colors.bg, padding: spacing.md, alignItems: 'center' },
  statNum: { color: colors.lime, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.inkFaint, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  sectionLabel: { color: colors.inkFaint, fontSize: 12, letterSpacing: 1.2, paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  crewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  actions: { marginTop: 'auto', paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.lg },
  editBtn: { borderWidth: 1, borderColor: colors.lineStrong, padding: spacing.md, alignItems: 'center' },
  editBtnText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  linkBtn: { alignItems: 'center', paddingVertical: spacing.xs },
  linkBtnText: { color: colors.inkFaint, fontSize: 13, fontWeight: '600' },
});
