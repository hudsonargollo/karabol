import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../lib/api';
import { authStore } from '../lib/authStore';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Screen } from '../components/Screen';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

// TODO: replace email/password with Phone+OTP or OAuth per PRD 2 "Unified
// Authentication" — this is a functional stand-in until an SMS/OAuth
// provider is chosen, so the rest of the patron flow can be built/tested.
export function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } =
        mode === 'login'
          ? await api.login(identifier, password)
          : await api.register({ email: identifier, password, displayName });
      await authStore.setToken(token);
      await authStore.setUser(user);
      navigation.replace('TableJoin');
    } catch {
      setError(mode === 'login' ? 'Invalid credentials' : 'Could not register — try a different email');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.brand}>
        <Text style={styles.brandKara}>Kara</Text>
        <Text style={styles.brandBol}>bol</Text>
      </View>
      <Text style={styles.title}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>

      {mode === 'register' && <TextField label="Your name" value={displayName} onChangeText={setDisplayName} />}
      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={identifier}
        onChangeText={setIdentifier}
      />
      <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title={mode === 'login' ? 'Log in' : 'Sign up'}
        onPress={submit}
        loading={submitting}
        disabled={!identifier || !password}
      />
      <Button
        variant="ghost"
        title={mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', marginBottom: spacing.sm },
  brandKara: { color: colors.ink, fontSize: 24, ...type.displayItalic },
  brandBol: { color: colors.lime, fontSize: 24, ...type.displayItalic },
  title: { color: colors.ink, fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  error: { color: colors.danger, fontSize: 13 },
});
