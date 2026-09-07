import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
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

// A printed table QR encodes https://karabol.app/join?slug=<venueSlug>&qr=<qrToken>
// (see POST /venues/:id/tables on the API) — parsed by hand rather than via
// URL/URLSearchParams, which aren't reliably available on Hermes without an
// extra polyfill dependency this doesn't otherwise need.
function parseJoinUrl(data: string): { slug: string; qr: string } | null {
  const slug = data.match(/[?&]slug=([^&]+)/)?.[1];
  const qr = data.match(/[?&]qr=([^&]+)/)?.[1];
  if (!slug || !qr) return null;
  return { slug: decodeURIComponent(slug), qr: decodeURIComponent(qr) };
}

// 3.1 Table Association — real camera QR scanning (native only; expo-camera
// has no web implementation, so web/Expo Go-in-browser always falls back to
// the PIN form below, same as a permission denial does on device).
export function TableJoinScreen({ navigation }: Props) {
  const [venueSlug, setVenueSlug] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  async function join(venueSlugValue: string, credentials: { pin: string } | { qrToken: string }) {
    setError(null);
    setSubmitting(true);
    try {
      const { venueId, tableId } = await api.joinTable(venueSlugValue, credentials);
      navigation.replace('Home', { venueId, tableId });
    } catch {
      setError('Table not found — check the venue name and PIN');
      scannedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  function onScan(result: BarcodeScanningResult) {
    if (scannedRef.current) return;
    const parsed = parseJoinUrl(result.data);
    if (!parsed) return;
    scannedRef.current = true;
    join(parsed.slug, { qrToken: parsed.qr });
  }

  const canUseCamera = Platform.OS !== 'web' && permission?.granted;

  return (
    <Screen>
      <Text style={styles.title}>Escanea el QR{'\n'}de tu mesa</Text>
      <Text style={styles.sub}>Así sabemos en qué bar estás y a qué lista te unes.</Text>

      <View style={styles.frame}>
        {canUseCamera ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onScan}
          />
        ) : (
          <View style={styles.frameFallback}>
            {Platform.OS !== 'web' && !permission?.granted && (
              <Pressable onPress={requestPermission} style={styles.permBtn}>
                <Text style={styles.permBtnText}>Dar permiso de cámara</Text>
              </Pressable>
            )}
          </View>
        )}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      <View style={styles.mcRow}>
        <MascotBlock label="LA PARABA" accent={colors.cyan} size={46} source={karabol.parabaHero} />
        <TypedBubble accent={colors.cyan} text="Apunta al QR de la mesa… ¡ya casi!" style={{ flex: 1, maxWidth: undefined }} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {!showPinForm ? (
        <Pressable onPress={() => setShowPinForm(true)}>
          <Text style={styles.pinLink}>Ingresar código de mesa</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O INGRESA EL CÓDIGO</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextField placeholder="e.g. moe" label="Venue name" autoCapitalize="none" value={venueSlug} onChangeText={setVenueSlug} />
          <TextField placeholder="6-digit PIN" label="Table PIN" keyboardType="number-pad" value={pin} onChangeText={setPin} />
          <Button title="Join table" onPress={() => join(venueSlug, { pin })} loading={submitting} disabled={!venueSlug || !pin} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 30 },
  sub: { color: colors.inkFaint, fontSize: 13, marginTop: -spacing.sm },
  frame: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  frameFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  permBtn: { borderWidth: 1, borderColor: colors.lime, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  permBtnText: { color: colors.lime, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.lime },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  mcRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'rgba(46,230,255,0.35)',
    padding: spacing.md,
  },
  pinLink: { color: colors.inkFaint, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1 },
  error: { color: colors.danger, fontSize: 13 },
});
