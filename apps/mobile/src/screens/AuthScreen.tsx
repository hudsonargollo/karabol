import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import type { RootStackParamList } from '../../App';
import { api } from '../lib/api';
import { authStore } from '../lib/authStore';
import { GOOGLE_CLIENT_ID } from '../lib/config';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { MascotBlock } from '../components/MascotBlock';
import { karabol } from '../assets/karabol';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

WebBrowser.maybeCompleteAuthSession();

// Google's OAuth2 discovery doc for the implicit id_token flow — the
// building block `expo-auth-session/providers/google` wraps; using it
// directly here since its exact wrapper API has moved around across SDKs.
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

// Google's implicit id_token flow requires a nonce; verifyIdToken() on the
// server checks signature/issuer/audience/expiry but doesn't currently
// cross-check this value, so it's a request-shape requirement here rather
// than a full replay-protection guarantee yet.
const nonce = Crypto.randomUUID();
const redirectUri = AuthSession.makeRedirectUri();

// Google-only sign-in per product direction (no phone/password form, and
// Apple Sign-In is on hold — it needs a paid Apple Developer account and
// only verifies on a real iOS build, neither available here). Finds-or-
// creates the patron server-side; CAPI's line below is the only copy this
// screen needs since there's no separate signup step to explain.
export function AuthScreen({ navigation }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: { nonce },
    },
    discovery,
  );

  useEffect(() => {
    if (__DEV__) console.log('[auth] Google redirect URI to whitelist:', redirectUri);
  }, []);

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') setError('No se pudo entrar con Google');
      return;
    }
    const idToken = response.params.id_token;
    if (!idToken) {
      setError('Google no devolvió un token válido');
      return;
    }

    setSubmitting(true);
    setError(null);
    api
      .google(idToken)
      .then(async ({ token, user, isNewUser }) => {
        await authStore.setToken(token);
        await authStore.setUser(user);
        navigation.replace(isNewUser ? 'CrewPick' : 'TableJoin');
      })
      .catch(() => setError('No se pudo entrar con Google'))
      .finally(() => setSubmitting(false));
  }, [response, navigation]);

  return (
    <Screen center>
      <Image source={karabol.logo} style={styles.brand} resizeMode="contain" />
      <Text style={styles.title}>Karaoke con{'\n'}sabor boliviano</Text>
      <Text style={styles.sub}>Entra con Google — 5 segundos y estás en la lista.</Text>

      {!GOOGLE_CLIENT_ID && (
        <Text style={styles.warn}>
          Falta configurar GOOGLE_CLIENT_ID en src/lib/config.ts para que este botón funcione.
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title="Continuar con Google"
        onPress={() => promptAsync()}
        loading={submitting}
        disabled={!request || submitting || !GOOGLE_CLIENT_ID}
      />

      <View style={styles.mcRow}>
        <MascotBlock label="CAPI" accent={colors.purple} size={54} source={karabol.capiHead} />
        <Text style={styles.mcText}>
          <Text style={styles.mcName}>CAPI: </Text>
          Tranqui, bro. Solo usamos tu cuenta de Google para avisarte cuando te toque.{' '}
          <Text style={styles.mcLink}>Términos</Text> · <Text style={styles.mcLink}>Privacidad</Text>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { width: 180, height: 54, marginBottom: spacing.md },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 30, textAlign: 'center' },
  sub: { color: colors.inkFaint, fontSize: 14, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  warn: { color: colors.magenta, fontSize: 12, textAlign: 'center', marginBottom: spacing.sm },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
  mcRow: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  mcText: { flex: 1, color: colors.inkFaint, fontSize: 11, lineHeight: 16 },
  mcName: { color: colors.purple, fontWeight: '700' },
  mcLink: { color: colors.ink, textDecorationLine: 'underline' },
});
