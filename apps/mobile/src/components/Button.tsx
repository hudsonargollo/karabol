import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading }: Props) {
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isGhost ? styles.ghost : styles.primary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.ink : colors.limeInk} />
      ) : (
        <Text style={[styles.text, isGhost ? styles.textGhost : styles.textPrimary, isDisabled && styles.textDisabled]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.lime },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.lineStrong },
  disabled: { backgroundColor: colors.surface3, borderColor: colors.lineStrong },
  pressed: { opacity: 0.85 },
  text: { fontSize: 15, fontWeight: '800', fontFamily: 'System' },
  textPrimary: { color: colors.limeInk },
  textGhost: { color: colors.ink },
  textDisabled: { color: colors.inkFaint },
});
