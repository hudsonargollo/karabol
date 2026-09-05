import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { authStore } from '../lib/authStore';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

// 01 Splash — resolves where "ENTRAR AL SHOW" should land (TableJoin if
// already signed in, Auth otherwise) while the brand glows in.
export function SplashScreen({ navigation }: Props) {
  const [target, setTarget] = useState<keyof RootStackParamList>('Auth');
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    authStore.getToken().then((token) => setTarget(token ? 'TableJoin' : 'Auth'));

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const shadowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [16, 34] });

  return (
    <View style={styles.screen}>
      <View style={styles.crewBand} />
      <View style={styles.fade} />

      <View style={styles.content}>
        <Animated.Text
          style={[
            styles.wordmark,
            { textShadowRadius: shadowRadius as unknown as number, textShadowColor: colors.lime, textShadowOffset: { width: 0, height: 0 } },
          ]}
        >
          KARABOL
        </Animated.Text>
        <Text style={styles.tagline}>Karaoke con sabor boliviano. Queue up. Battle. Reign.</Text>

        <Pressable onPress={() => navigation.replace(target)}>
          <Animated.View
            style={[
              styles.primaryBtn,
              { shadowRadius: shadowRadius as unknown as number, shadowColor: colors.lime, shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 } },
            ]}
          >
            <Text style={styles.primaryBtnText}>ENTRAR AL SHOW</Text>
          </Animated.View>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => navigation.replace('Auth')}>
          <Text style={styles.secondaryBtnText}>Solo mirar la cola</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  crewBand: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: colors.surface2 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%', backgroundColor: colors.bg, opacity: 0.55 },
  content: { marginTop: 'auto', padding: spacing.xl, gap: spacing.md },
  wordmark: {
    color: colors.lime,
    fontSize: 44,
    ...type.displayItalic,
  },
  tagline: { color: colors.ink, fontSize: 15 },
  primaryBtn: { backgroundColor: colors.lime, padding: spacing.lg },
  primaryBtnText: { color: colors.limeInk, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    padding: spacing.md,
  },
  secondaryBtnText: { color: colors.ink, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
