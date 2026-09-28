import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontFamilies } from '@/ui/fonts';
import { DownloadIcon } from '@/ui/icons/DownloadIcon';
import { HistoryIcon } from '@/ui/icons/HistoryIcon';
import { PantryIcon } from '@/ui/icons/PantryIcon';
import { useThemeColors } from '@/ui/theme';

type TabIcon = (props: { size?: number; color: string; strokeWidth?: number }) => React.JSX.Element;

interface TabButtonProps extends PressableProps {
  label: string;
  Icon: TabIcon;
  isFocused?: boolean;
}

function TabButton({ label, Icon, isFocused, ...pressableProps }: TabButtonProps) {
  const colors = useThemeColors();
  return (
    <Pressable {...pressableProps} style={styles.tabButton}>
      <View style={[styles.iconPill, isFocused && { backgroundColor: colors.accentSoft }]}>
        <Icon size={22} color={colors.ink} />
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.ink : colors.inkMuted, fontFamily: isFocused ? fontFamilies.bodyBold : fontFamilies.bodyMedium },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.outline, paddingBottom: insets.bottom + 8 }]}>
          <TabTrigger name="pantry" href="/" asChild>
            <TabButton label="Pantry" Icon={PantryIcon} />
          </TabTrigger>
          <TabTrigger name="history" href="/history" asChild>
            <TabButton label="History" Icon={HistoryIcon} />
          </TabTrigger>
          <TabTrigger name="backup" href="/backup" asChild>
            <TabButton label="Backup" Icon={DownloadIcon} />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  iconPill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
  },
});
