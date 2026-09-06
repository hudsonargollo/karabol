import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api } from '../lib/api';
import { authStore } from '../lib/authStore';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Screen } from '../components/Screen';
import { MascotBlock } from '../components/MascotBlock';
import { karabol } from '../assets/karabol';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

// TODO: replace email/password with Phone+OTP or OAuth per PRD 2 "Unified
// Authentication" — this is a functional stand-in until an SMS/OAuth
// provider is chosen, so the rest of the patron flow can be built/tested.
export function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
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
      navigation.replace(mode === 'register' ? 'CrewPick' : 'TableJoin');
    } catch {
      setError(mode === 'login' ? 'Invalid credentials' : 'Could not register — try a different email');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Image source={karabol.logo} style={styles.brand} resizeMode="contain" />
      <Text style={styles.title}>{mode === 'register' ? '¿Cómo te\nanunciamos?' : 'Bienvenido\nde vuelta'}</Text>
      <Text style={styles.sub}>
        {mode === 'register'
          ? 'Crea tu cuenta en 10 segundos o entra si ya cantaste antes.'
          : 'Entra para volver a la lista donde la dejaste.'}
      </Text>

      <View style={styles.segment}>
        <Pressable style={[styles.segmentBtn, mode === 'register' && styles.segmentActive]} onPress={() => setMode('register')}>
          <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>CREAR CUENTA</Text>
        </Pressable>
        <Pressable style={[styles.segmentBtn, mode === 'login' && styles.segmentActive]} onPress={() => setMode('login')}>
          <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>YA TENGO CUENTA</Text>
        </Pressable>
      </View>

      {mode === 'register' && (
        <TextField label="Tu nombre de escenario" value={displayName} onChangeText={setDisplayName} />
      )}
      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={identifier}
        onChangeText={setIdentifier}
      />
      <TextField label="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title={mode === 'register' ? 'CREAR CUENTA →' : 'ENTRAR →'}
        onPress={submit}
        loading={submitting}
        disabled={!identifier || !password || (mode === 'register' && !displayName)}
      />

      <View style={styles.mcRow}>
        <MascotBlock label="CAPI" accent={colors.purple} size={54} source={karabol.capiHead} />
        <Text style={styles.mcText}>
          <Text style={styles.mcName}>CAPI: </Text>
          Tranqui, bro. Solo pedimos tu email para avisarte cuando te toque.{' '}
          <Text style={styles.mcLink}>Términos</Text> · <Text style={styles.mcLink}>Privacidad</Text>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { width: 160, height: 48, marginBottom: spacing.sm, marginLeft: -6 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 30 },
  sub: { color: colors.inkFaint, fontSize: 13, marginTop: -spacing.sm },
  segment: { flexDirection: 'row', borderWidth: 1, borderColor: colors.lineStrong },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 11 },
  segmentActive: { backgroundColor: colors.lime },
  segmentText: { color: colors.inkFaint, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  segmentTextActive: { color: colors.limeInk },
  error: { color: colors.danger, fontSize: 13 },
  mcRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  mcText: { flex: 1, color: colors.inkFaint, fontSize: 11, lineHeight: 16 },
  mcName: { color: colors.purple, fontWeight: '700' },
  mcLink: { color: colors.ink, textDecorationLine: 'underline' },
});
