import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { authStore } from '../lib/authStore';
import { CREW } from '../lib/crew';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CrewPick'>;

// 01d Crew Pick — shown once, right after creating an account. The choice
// is local-only (no backend field yet, see authStore.setCrew) and just
// picks which mascot shows up as "your" avatar around the app.
export function CrewPickScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState(CREW[0].id);

  useEffect(() => {
    authStore.getUser().then((u) => setName(u?.displayName ?? ''));
  }, []);

  async function confirm() {
    await authStore.setCrew(picked);
    navigation.replace('TableJoin');
  }

  async function skip() {
    navigation.replace('TableJoin');
  }

  const active = CREW.find((c) => c.id === picked) ?? CREW[0];

  return (
    <Screen>
      <View>
        <Text style={styles.title}>
          {name ? `Hola, ${name}.\n` : ''}¿Quién es tu crew?
        </Text>
        <Text style={styles.sub}>Tu mascota te anuncia en la lista y celebra tus victorias.</Text>
      </View>

      <View style={styles.previewWrap}>
        <Image source={active.img} style={[styles.preview, { borderColor: active.accent }]} resizeMode="cover" />
        <View style={[styles.previewLine, { borderColor: active.accent }]}>
          <Text style={styles.previewLineText}>{active.line}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {CREW.map((c) => {
          const isActive = c.id === picked;
          return (
            <Pressable
              key={c.id}
              onPress={() => setPicked(c.id)}
              style={[styles.cell, { borderColor: isActive ? c.accent : colors.line }]}
            >
              <Image source={c.head ?? c.img} style={styles.cellImg} resizeMode="cover" />
              <Text
                style={[
                  styles.cellLabel,
                  { color: isActive ? colors.limeInk : colors.inkFaint, backgroundColor: isActive ? c.accent : colors.surface2 },
                ]}
                numberOfLines={1}
              >
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 'auto', gap: spacing.md }}>
        <Button title="¡LISTO, A CANTAR! 🎤" onPress={confirm} />
        <Pressable onPress={skip}>
          <Text style={styles.skip}>Elegir después</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const CELL_SIZE = 64;

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 24, lineHeight: 28, ...type.heading },
  sub: { color: colors.inkFaint, fontSize: 13, marginTop: spacing.xs },
  previewWrap: { alignSelf: 'center', alignItems: 'flex-end' },
  preview: { width: 180, height: 180, borderWidth: 1 },
  previewLine: {
    position: 'absolute',
    top: 4,
    right: -10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    padding: 8,
    maxWidth: 140,
  },
  previewLineText: { color: colors.ink, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  cell: { width: CELL_SIZE, borderWidth: 2, backgroundColor: colors.surface2 },
  cellImg: { width: '100%', height: CELL_SIZE, backgroundColor: colors.surface3 },
  cellLabel: { fontSize: 9, letterSpacing: 0.5, fontWeight: '700', textAlign: 'center', paddingVertical: 5 },
  skip: { color: colors.inkFaint, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' },
});
