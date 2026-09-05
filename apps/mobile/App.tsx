import { StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from './src/screens/SplashScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { TableJoinScreen } from './src/screens/TableJoinScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { BattleScreen } from './src/screens/BattleScreen';
import { WinnerScreen } from './src/screens/WinnerScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PerformanceScreen } from './src/screens/PerformanceScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { colors } from './src/theme';

// 3.1 Patron Panel — splash -> auth -> table association -> the Home/Queue/
// Battle/Profile tab set -> live DSP scoring when it's your turn.
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  TableJoin: undefined;
  Home: { venueId: string; tableId: string };
  Queue: { venueId: string; tableId: string };
  Battle: { venueId: string; tableId: string };
  Profile: { venueId: string; tableId: string };
  Performance: { queueEntryId: string; venueId: string; tableId: string };
  Winner: { venueId: string; tableId: string; winnerLabel: string; votePink: number; voteLime: number };
  Leaderboard: { venueId: string; tableId: string };
  Wallet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const karabolTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    primary: colors.lime,
  },
};

export default function App() {
  return (
    <View style={styles.webBackdrop}>
      <View style={styles.phoneFrame}>
        <NavigationContainer theme={karabolTheme}>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.ink,
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Welcome' }} />
            <Stack.Screen name="TableJoin" component={TableJoinScreen} options={{ title: 'Scan your table' }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Queue" component={QueueScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Battle" component={BattleScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Performance" component={PerformanceScreen} options={{ title: 'Your turn!' }} />
            <Stack.Screen name="Winner" component={WinnerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Ranking' }} />
            <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'My rewards' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </View>
  );
}

// On native this is inert (the device screen already is the frame). On the
// web build it keeps the app at a phone-shaped width instead of stretching
// full-bleed across a desktop browser.
const styles = StyleSheet.create({
  webBackdrop: { flex: 1, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  phoneFrame: { flex: 1, width: '100%', maxWidth: 430, overflow: 'hidden' },
});
