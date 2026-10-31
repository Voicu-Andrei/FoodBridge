import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/text';
import { enterUp } from '@/constants/motion';
import { Spacing, TabBarClearance } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Scrollable tab screen with the editorial serif title and safe-area padding. */
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 96 + TabBarClearance },
      ]}>
      <Animated.View entering={enterUp(0, 450)}>
        <Txt variant="display">{title}</Txt>
      </Animated.View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },
});
