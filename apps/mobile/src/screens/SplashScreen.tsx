import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { authStore } from '../lib/authStore';
import { karabol } from '../assets/karabol';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

// Crossfades through the bundled crew art — the mockup uses a dedicated
// slideshow shot per crew member (lineup, walk-in, selfie…), but only
// these hero shots are bundled locally today.
const SLIDES = [karabol.crew, karabol.karaboyHero, karabol.cambitaHero, karabol.alpachoHero, karabol.parabaHero, karabol.bearHero];
const SLIDE_MS = 3000;

export function SplashScreen({ navigation }: Props) {
  const [target, setTarget] = useState<keyof RootStackParamList>('Auth');
  const [slide, setSlide] = useState(0);
  const glow = useRef(new Animated.Value(0)).current;
  const slideOpacity = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(slideOpacity, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => {
        setSlide((n) => (n + 1) % SLIDES.length);
        Animated.timing(slideOpacity, { toValue: 1, duration: 450, useNativeDriver: true }).start();
      });
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [slideOpacity]);

  const shadowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [16, 34] });

  return (
    <View style={styles.screen}>
      <Animated.Image source={SLIDES[slide]} style={[styles.crewBand, { opacity: slideOpacity }]} resizeMode="cover" />
      <View style={styles.fade} />

      <View style={styles.content}>
        <Image source={karabol.logo} style={styles.wordmark} resizeMode="contain" />
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
  crewBand: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', width: '100%' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%', backgroundColor: colors.bg, opacity: 0.82 },
  content: { marginTop: 'auto', padding: spacing.xl, gap: spacing.md },
  wordmark: { width: 220, height: 66, marginLeft: -8 },
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
