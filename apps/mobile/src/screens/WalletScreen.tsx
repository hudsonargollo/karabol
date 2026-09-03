import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { api, type WalletItem } from '../lib/api';
import { colors, radius, spacing } from '../theme';

const TIER_LABEL: Record<WalletItem['tier'], string> = {
  GOLD: 'Gold',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
};

const TIER_COLOR: Record<WalletItem['tier'], string> = {
  GOLD: colors.gold,
  SILVER: colors.silver,
  BRONZE: colors.bronze,
};

// 3.1 Digital Wallet / 3.5 QR Redemption — earned discount QR codes, newest first.
export function WalletScreen() {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getWallet().then(setItems).catch(() => setError('Could not load your rewards'));
  }, []);

  if (error) return <Text style={[styles.message, styles.messageError]}>{error}</Text>;
  if (items.length === 0) return <Text style={styles.message}>Sing a song to start earning rewards!</Text>;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={[styles.card, item.redeemedAt ? styles.cardRedeemed : null]}>
          <Text style={[styles.tier, { color: TIER_COLOR[item.tier] }]}>
            {TIER_LABEL[item.tier]} — {item.discountPercent}% off
          </Text>
          <Image source={{ uri: item.qrImageDataUrl }} style={styles.qr} />
          <Text style={styles.caption}>{item.redeemedAt ? 'Redeemed' : 'Show this to your bartender'}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.lg },
  message: { flex: 1, backgroundColor: colors.bg, color: colors.inkSoft, padding: spacing.xl, fontSize: 15 },
  messageError: { color: colors.danger },
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
  },
  cardRedeemed: { opacity: 0.45 },
  tier: { fontSize: 17, fontWeight: '700' },
  qr: { width: 200, height: 200, borderRadius: radius.sm },
  caption: { color: colors.inkFaint, fontSize: 13 },
});
