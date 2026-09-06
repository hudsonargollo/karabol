import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../lib/api';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Screen } from '../components/Screen';
import { MascotBlock } from '../components/MascotBlock';
import { TypedBubble } from '../components/TypedBubble';
import { karabol } from '../assets/karabol';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TableJoin'>;

const CORNER = 34;

// 3.1 Table Association. TODO: swap the venue-slug/PIN form for a QR
// scanner (expo-camera) once we're testing on a device with the venue's
// printed QR codes — the PIN path is a fallback per the PRD and works today.
// The frame below is decorative chrome for that future scanner; the real
// input is the form underneath it.
export function TableJoinScreen({ navigation }: Props) {
  const [venueSlug, setVenueSlug] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(scanY, { toValue: 0, duration: 1600, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanY]);

  async function join() {
    setError(null);
    setSubmitting(true);
    try {
      const { venueId, tableId } = await api.joinTable(venueSlug, pin);
      navigation.replace('Home', { venueId, tableId });
    } catch {
      setError('Table not found — check the venue name and PIN');
    } finally {
      setSubmitting(false);
    }
  }

  const scanTop = scanY.interpolate({ inputRange: [0, 1], outputRange: ['4%', '92%'] });

  return (
    <Screen>
      <Text style={styles.title}>Escanea el QR{'\n'}de tu mesa</Text>
      <Text style={styles.sub}>Así sabemos en qué bar estás y a qué lista te unes.</Text>

      <View style={styles.frame}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <Animated.View style={[styles.scanLine, { top: scanTop }]} />
      </View>

      <View style={styles.mcRow}>
        <MascotBlock label="LA PARABA" accent={colors.cyan} size={46} source={karabol.parabaHero} />
        <TypedBubble accent={colors.cyan} text="Apunta al QR de la mesa… ¡ya casi!" style={{ flex: 1, maxWidth: undefined }} />
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>O INGRESA EL CÓDIGO</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextField placeholder="e.g. moe" label="Venue name" autoCapitalize="none" value={venueSlug} onChangeText={setVenueSlug} />
      <TextField placeholder="6-digit PIN" label="Table PIN" keyboardType="number-pad" value={pin} onChangeText={setPin} />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Join table" onPress={join} loading={submitting} disabled={!venueSlug || !pin} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 30 },
  sub: { color: colors.inkFaint, fontSize: 13, marginTop: -spacing.sm },
  frame: {
    alignSelf: 'center',
    width: 180,
    height: 180,
    position: 'relative',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.lime },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scanLine: { position: 'absolute', left: 6, right: 6, height: 2, backgroundColor: colors.lime },
  mcRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'rgba(46,230,255,0.35)',
    padding: spacing.md,
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1 },
  error: { color: colors.danger, fontSize: 13 },
});
