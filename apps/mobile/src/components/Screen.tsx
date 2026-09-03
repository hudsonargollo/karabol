import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';

export function Screen({ children, center }: { children: ReactNode; center?: boolean }) {
  return <View style={[styles.screen, center && styles.center]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, gap: spacing.lg },
  center: { alignItems: 'center', justifyContent: 'center' },
});
