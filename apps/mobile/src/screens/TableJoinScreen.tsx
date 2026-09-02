import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'TableJoin'>;

// TODO: replace PIN entry with a QR scanner (expo-camera / expo-barcode-scanner).
export function TableJoinScreen({ navigation }: Props) {
  const [pin, setPin] = useState('');

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text>Enter your table PIN</Text>
      <TextInput value={pin} onChangeText={setPin} keyboardType="number-pad" style={{ borderWidth: 1, padding: 8 }} />
      <Button
        title="Join table"
        onPress={() => navigation.navigate('Search', { venueId: 'TODO', tableId: 'TODO' })}
      />
    </View>
  );
}
