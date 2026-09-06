import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { MascotBlock } from '../components/MascotBlock';
import { TypedBubble } from '../components/TypedBubble';
import { Confetti } from '../components/Confetti';
import { karabol } from '../assets/karabol';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Winner'>;

// Marisol (Cambita) vs Diego (Alpacho) are the only two Battle contestants
// today, so the champion art/badge/title just switches on which of the two
// names won — swap this for real per-round contestant data once battles
// have a backend.
const WINNER_ART: Record<string, { hero: number; badge: number; title: string }> = {
  MARISOL: { hero: karabol.cambitaHero, badge: karabol.reinaDeLaNoche, title: '¡CAMPEONA!' },
  DIEGO: { hero: karabol.alpachoHero, badge: karabol.reiDeLaNoche, title: '¡CAMPEÓN!' },
};

// 06 Winner — reached from Battle once voting closes.
export function WinnerScreen({ route, navigation }: Props) {
  const { venueId, tableId, winnerLabel, votePink, voteLime } = route.params;
  const votes = votePink + voteLime;
  const art = WINNER_ART[winnerLabel] ?? WINNER_ART.DIEGO;

  return (
    <View style={styles.screen}>
      <Confetti />
      <Image source={art.badge} style={styles.badge} resizeMode="contain" />
      <Text style={styles.title}>{art.title}</Text>
      <View style={styles.heroWrap}>
        <MascotBlock label={winnerLabel} accent={colors.lime} size={200} source={art.hero} />
        <TypedBubble accent={colors.lime} text="¡La reina de la noche!" style={styles.winBubble} />
      </View>
      <Text style={styles.name}>{winnerLabel}</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.lime }]}>{votes}</Text>
          <Text style={styles.statLabel}>VOTOS</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.magenta }]}>{votePink}</Text>
          <Text style={styles.statLabel}>ROJO</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.cyan }]}>{voteLime}</Text>
          <Text style={styles.statLabel}>LIMA</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={styles.shareBtn}
          onPress={() => Share.share({ message: `${winnerLabel} ganó la batalla en KARABOL con ${votes} votos 🏆` })}
        >
          <Text style={styles.shareBtnText}>COMPARTIR</Text>
        </Pressable>
        <Pressable style={styles.rematchBtn} onPress={() => navigation.replace('Battle', { venueId, tableId })}>
          <Text style={styles.rematchBtnText}>REVANCHA</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingTop: spacing.xxl },
  badge: { width: 96, height: 96, marginTop: spacing.lg },
  title: {
    color: colors.lime,
    fontSize: 30,
    textShadowColor: 'rgba(199,243,0,0.6)',
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 },
    ...type.displayItalic,
  },
  heroWrap: { marginVertical: spacing.lg, position: 'relative' },
  winBubble: { position: 'absolute', top: 4, right: -12 },
  name: { color: colors.ink, fontSize: 20, ...type.heading },
  stats: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800' },
  statLabel: { color: colors.inkFaint, fontSize: 11, letterSpacing: 1 },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  shareBtn: { backgroundColor: colors.lime, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  shareBtnText: { color: colors.limeInk, fontWeight: '700', fontSize: 14 },
  rematchBtn: { borderWidth: 1, borderColor: colors.magenta, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  rematchBtnText: { color: colors.magenta, fontWeight: '700', fontSize: 14 },
});
