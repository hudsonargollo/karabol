import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { MascotBlock } from '../components/MascotBlock';
import { Confetti } from '../components/Confetti';
import { colors, spacing, type } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Winner'>;

// 06 Winner — reached from Battle once voting closes.
export function WinnerScreen({ route, navigation }: Props) {
  const { venueId, tableId, winnerLabel, votePink, voteLime } = route.params;
  const votes = votePink + voteLime;

  return (
    <View style={styles.screen}>
      <Confetti />
      <Text style={styles.crown}>👑</Text>
      <Text style={styles.title}>¡CAMPEÓN!</Text>
      <MascotBlock label={winnerLabel} accent={colors.lime} size={200} style={{ marginVertical: spacing.lg }} />
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
  crown: { fontSize: 34, marginTop: spacing.lg },
  title: {
    color: colors.lime,
    fontSize: 30,
    textShadowColor: 'rgba(199,243,0,0.6)',
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 },
    ...type.displayItalic,
  },
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
