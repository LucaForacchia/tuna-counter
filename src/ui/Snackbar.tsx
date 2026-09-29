import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamilies } from './fonts';
import { useThemeColors } from './theme';

export interface SnackbarProps {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

/** A toast with an optional action, auto-dismissing after `durationMs` — no toast library needed for this. */
export function Snackbar({ visible, message, actionLabel, onAction, onDismiss, durationMs = 5000 }: SnackbarProps) {
  const colors = useThemeColors();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onDismiss]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.ink }]}>
      <Text style={[styles.message, { color: colors.background, fontFamily: fontFamilies.bodyRegular }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={[styles.action, { color: colors.accentSoft, fontFamily: fontFamilies.bodyBold }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 100,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  message: {
    fontSize: 14,
    flexShrink: 1,
  },
  action: {
    fontSize: 14,
  },
});
