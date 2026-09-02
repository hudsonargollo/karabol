import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../lib/api';
import { authStore } from '../lib/authStore';

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

  async function submit() {
    setError(null);
    try {
      const { token } =
        mode === 'login'
          ? await api.login(identifier, password)
          : await api.register({ email: identifier, password, displayName });
      await authStore.setToken(token);
      navigation.replace('TableJoin');
    } catch {
      setError(mode === 'login' ? 'Invalid credentials' : 'Could not register — try a different email');
    }
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>

      {mode === 'register' && (
        <TextInput
          placeholder="Your name"
          value={displayName}
          onChangeText={setDisplayName}
          style={{ borderWidth: 1, padding: 8 }}
        />
      )}
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={identifier}
        onChangeText={setIdentifier}
        style={{ borderWidth: 1, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 8 }}
      />

      <Button title={mode === 'login' ? 'Log in' : 'Sign up'} onPress={submit} />
      <Button
        title={mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
      />
      {error && <Text style={{ color: 'crimson' }}>{error}</Text>}
    </View>
  );
}
