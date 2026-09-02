import { useEffect, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import { api, type WalletItem } from '../lib/api';

const TIER_LABEL: Record<WalletItem['tier'], string> = {
  GOLD: 'Gold',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
};

// 3.1 Digital Wallet / 3.5 QR Redemption — earned discount QR codes, newest first.
export function WalletScreen() {
  const [items, setItems] = useState<WalletItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getWallet().then(setItems).catch(() => setError('Could not load your rewards'));
  }, []);

  if (error) return <Text style={{ padding: 24, color: 'crimson' }}>{error}</Text>;
  if (items.length === 0) return <Text style={{ padding: 24 }}>Sing a song to start earning rewards!</Text>;

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, gap: 16 }}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View
          style={{
            alignItems: 'center',
            gap: 8,
            padding: 16,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 12,
            opacity: item.redeemedAt ? 0.4 : 1,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600' }}>
            {TIER_LABEL[item.tier]} — {item.discountPercent}% off
          </Text>
          <Image source={{ uri: item.qrImageDataUrl }} style={{ width: 200, height: 200 }} />
          <Text style={{ color: '#666' }}>{item.redeemedAt ? 'Redeemed' : 'Show this to your bartender'}</Text>
        </View>
      )}
    />
  );
}
