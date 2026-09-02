import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen } from './src/screens/AuthScreen';
import { TableJoinScreen } from './src/screens/TableJoinScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { PerformanceScreen } from './src/screens/PerformanceScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { authStore } from './src/lib/authStore';

// 3.1 Patron Panel — auth -> table association -> YouTube search/queue ->
// live DSP scoring while singing -> digital wallet.
export type RootStackParamList = {
  Auth: undefined;
  TableJoin: undefined;
  Search: { venueId: string; tableId: string };
  Performance: { queueEntryId: string; venueId: string };
  Wallet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    authStore.getToken().then((token) => setInitialRoute(token ? 'TableJoin' : 'Auth'));
  }, []);

  if (!initialRoute) return null; // splash could go here

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Welcome' }} />
        <Stack.Screen name="TableJoin" component={TableJoinScreen} options={{ title: 'Scan your table' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Add a song' }} />
        <Stack.Screen name="Performance" component={PerformanceScreen} options={{ title: 'Your turn!' }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'My rewards' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
