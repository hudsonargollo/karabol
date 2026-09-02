import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

// TODO: sanitized YouTube Data API search + queue submission (3.1).
export function SearchScreen({ route }: Props) {
  return (
    <View style={{ padding: 24 }}>
      <Text>Search YouTube for table {route.params.tableId} — coming soon.</Text>
    </View>
  );
}
