import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors, spacing } from '../theme';

export type MainTab = 'Home' | 'Queue' | 'Battle' | 'Profile';

const TABS: { key: MainTab; label: string }[] = [
  { key: 'Home', label: 'HOME' },
  { key: 'Queue', label: 'COLA' },
  { key: 'Battle', label: 'BATTLE' },
  { key: 'Profile', label: 'PERFIL' },
];

type Props = {
  active: MainTab;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  venueId: string;
  tableId: string;
};

// Flat 4-tab bar shared by Home / Queue / Battle / Profile — text-only, no
// icons, per the design. Each tab is its own stack screen, so switching
// replaces the current one (they all take the same {venueId, tableId}).
export function BottomNav({ active, navigation, venueId, tableId }: Props) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => !isActive && navigation.replace(tab.key, { venueId, tableId })}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
    marginTop: -1,
  },
  tabActive: { borderTopColor: colors.lime },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.inkFaint },
  labelActive: { color: colors.lime },
});
