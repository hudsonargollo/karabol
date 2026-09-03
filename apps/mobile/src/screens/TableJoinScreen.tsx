import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../lib/api';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Screen } from '../components/Screen';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TableJoin'>;

// 3.1 Table Association. TODO: swap the venue-slug/PIN form for a QR
// scanner (expo-camera) once we're testing on a device with the venue's
// printed QR codes — the PIN path is a fallback per the PRD and works today.
export function TableJoinScreen({ navigation }: Props) {
  const [venueSlug, setVenueSlug] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function join() {
    setError(null);
    setSubmitting(true);
    try {
      const { venueId, tableId } = await api.joinTable(venueSlug, pin);
      navigation.replace('Search', { venueId, tableId });
    } catch {
      setError('Table not found — check the venue name and PIN');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Join your table</Text>
      <Text style={styles.sub}>Enter the venue name and the PIN printed on your table.</Text>
      <TextField placeholder="e.g. moe" label="Venue name" autoCapitalize="none" value={venueSlug} onChangeText={setVenueSlug} />
      <TextField placeholder="6-digit PIN" label="Table PIN" keyboardType="number-pad" value={pin} onChangeText={setPin} />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Join table" onPress={join} loading={submitting} disabled={!venueSlug || !pin} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.inkSoft, fontSize: 14, marginTop: -spacing.sm, marginBottom: spacing.sm },
  error: { color: colors.danger, fontSize: 13 },
});
