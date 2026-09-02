import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TableJoinScreen } from './src/screens/TableJoinScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { WalletScreen } from './src/screens/WalletScreen';

// 3.1 Patron Panel — table association -> YouTube search/queue -> digital wallet.
export type RootStackParamList = {
  TableJoin: undefined;
  Search: { venueId: string; tableId: string };
  Wallet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="TableJoin">
        <Stack.Screen name="TableJoin" component={TableJoinScreen} options={{ title: 'Scan your table' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Add a song' }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'My rewards' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
