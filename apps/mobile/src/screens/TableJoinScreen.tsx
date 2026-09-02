import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TableJoin'>;

// 3.1 Table Association. TODO: swap the venue-slug/PIN form for a QR
// scanner (expo-camera) once we're testing on a device with the venue's
// printed QR codes — the PIN path is a fallback per the PRD and works today.
export function TableJoinScreen({ navigation }: Props) {
  const [venueSlug, setVenueSlug] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setError(null);
    try {
      const { venueId, tableId } = await api.joinTable(venueSlug, pin);
      navigation.replace('Search', { venueId, tableId });
    } catch {
      setError('Table not found — check the venue name and PIN');
    }
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Join your table</Text>
      <TextInput
        placeholder="Venue name"
        autoCapitalize="none"
        value={venueSlug}
        onChangeText={setVenueSlug}
        style={{ borderWidth: 1, padding: 8 }}
      />
      <TextInput
        placeholder="Table PIN"
        keyboardType="number-pad"
        value={pin}
        onChangeText={setPin}
        style={{ borderWidth: 1, padding: 8 }}
      />
      <Button title="Join table" onPress={join} />
      {error && <Text style={{ color: 'crimson' }}>{error}</Text>}
    </View>
  );
}
