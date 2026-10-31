import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';

/** Web fallback for the native tab bar, used only for previewing layouts in a browser. */
export default function AppTabs() {
  const theme = useTheme();
  const { t } = useT();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View style={styles.barWrap}>
          <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <TabTrigger name="index" href="/" asChild>
              <TabButton>{t('tab.offers')}</TabButton>
            </TabTrigger>
            <TabTrigger name="map" href="/map" asChild>
              <TabButton>{t('tab.map')}</TabButton>
            </TabTrigger>
            <TabTrigger name="orders" href="/orders" asChild>
              <TabButton>{t('tab.orders')}</TabButton>
            </TabTrigger>
            <TabTrigger name="impact" href="/impact" asChild>
              <TabButton>{t('tab.impact')}</TabButton>
            </TabTrigger>
            <TabTrigger name="account" href="/account" asChild>
              <TabButton>{t('tab.account')}</TabButton>
            </TabTrigger>
          </View>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: Omit<TabTriggerSlotProps, 'ref'>) {
  const theme = useTheme();
  return (
    <Pressable {...props} style={[styles.button, isFocused && { backgroundColor: theme.surfaceAlt }]}>
      <Txt variant="caption" tint={isFocused ? theme.accent : theme.inkMuted}>
        {children}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barWrap: { position: 'absolute', left: 0, right: 0, bottom: Spacing.lg, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  button: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
});
