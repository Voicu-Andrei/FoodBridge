import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedNumber } from '@/components/animated-number';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Txt } from '@/components/text';
import { enterUp } from '@/constants/motion';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatEUR } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

const AMOUNTS = [25, 50, 100, 200];

export default function TopUpSheet() {
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { need } = useLocalSearchParams<{ need?: string }>();
  const me = useActiveBusiness();
  const topUp = useAppStore((s) => s.topUp);

  const needed = Math.max(0, Number(need ?? 0) || 0);
  const [amount, setAmount] = useState(() => AMOUNTS.find((a) => a >= needed) ?? AMOUNTS[AMOUNTS.length - 1]);

  const confirm = () => {
    topUp(amount);
    haptics.success();
    router.back();
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
      <Txt variant="title">{t('topup.title')}</Txt>
      <Txt variant="body" color="inkMuted" style={styles.body}>
        {t('topup.body')}
      </Txt>

      {needed > 0 && (
        <Animated.View entering={enterUp(80)} style={[styles.need, { backgroundColor: theme.accentSoft }]}>
          <Icon sf="exclamationmark.circle.fill" md="error" size={16} color={theme.accent} />
          <Txt variant="caption" tint={theme.accent} style={styles.flex}>
            {t('topup.need', { amount: formatEUR(needed, lang) })}
          </Txt>
        </Animated.View>
      )}

      <View style={styles.amountBlock}>
        <AnimatedNumber value={amount} format={(n) => formatEUR(Math.round(n), lang)} variant="display" style={styles.amount} />
        <Txt variant="caption" color="inkMuted">
          {t('detail.walletAfter', { amount: formatEUR(me.walletBalance + amount, lang) })}
        </Txt>
      </View>

      <View style={styles.chips}>
        {AMOUNTS.map((value) => {
          const active = value === amount;
          return (
            <PressableScale
              key={value}
              haptic="select"
              onPress={() => setAmount(value)}
              style={[
                styles.chip,
                { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.line },
              ]}>
              <Txt variant="bodyMedium" tint={active ? theme.onPrimary : theme.ink}>
                {formatEUR(value, lang).replace(/[.,]00/, '')}
              </Txt>
            </PressableScale>
          );
        })}
      </View>

      <PressableScale onPress={confirm} style={[styles.confirm, { backgroundColor: theme.accent }]}>
        <Icon sf="plus.circle.fill" md="add_circle" size={18} color="#FFFFFF" />
        <Txt variant="bodyMedium" tint="#FFFFFF" style={styles.confirmText}>
          {t('topup.add', { amount: formatEUR(amount, lang) })}
        </Txt>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingTop: Spacing.xxl },
  flex: { flex: 1 },
  body: { marginTop: Spacing.sm },
  need: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.lg },
  amountBlock: { alignItems: 'center', marginTop: Spacing.xxl, gap: Spacing.xs },
  amount: { fontSize: 52, lineHeight: 58, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: 17,
    borderRadius: Radius.pill,
  },
  confirmText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
});
