import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { authStore } from '../lib/authStore';
import { BottomNav } from '../components/BottomNav';
import { MascotBlock } from '../components/MascotBlock';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const CREW = [
  { label: 'Diablada', accent: colors.magenta },
  { label: 'Alpacho', accent: colors.lime },
  { label: 'Jucumari', accent: colors.cyan },
  { label: 'Paraba', accent: colors.purple },
];

// 08 Perfil — real display name from auth; there's no stats/achievements
// backend yet so those show as dashes rather than invented numbers. "Bio"
// is local-only (no profile-update endpoint yet), but genuinely editable.
export function ProfileScreen({ route, navigation }: Props) {
  const { venueId, tableId } = route.params;
  const [name, setName] = useState('');
  const [bio, setBio] = useState('Karaoke es vida, bro…');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);

  useEffect(() => {
    authStore.getUser().then((u) => setName(u?.displayName ?? 'Cantante'));
  }, []);

  async function logout() {
    await authStore.clear();
    navigation.replace('Auth');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{name}</Text>
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
        <MascotBlock label={name.slice(0, 2) || '?'} accent={colors.purple} size={56} />
      </View>

      <View style={styles.statsGrid}>
        {['CANCIONES', 'BATTLES', 'PROMEDIO'].map((label) => (
          <View key={label} style={styles.statCell}>
            <Text style={styles.statNum}>—</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>CREW</Text>
      <View style={styles.crewRow}>
        {CREW.map((m) => (
          <MascotBlock key={m.label} label={m.label} accent={m.accent} size={72} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.xl,
    paddingTop: spacing.xl,
  },
  name: { color: colors.ink, fontSize: 22, ...type.heading },
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
