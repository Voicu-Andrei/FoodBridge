import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AnimatedNumber } from '@/components/animated-number';
import { CategoryBadge } from '@/components/category-art';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Txt } from '@/components/text';
import { enterUp, layoutTransition } from '@/constants/motion';
import { Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Language, Transaction, TransactionKind } from '@/data/types';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useT, type StringKey } from '@/i18n';
import { formatActivityTime, formatEUR } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

const CREAM = '#F6F0E4';
const CREAM_MUTED = 'rgba(246,240,228,0.7)';

const TX_STYLE: Record<TransactionKind, { sf: SFSymbol; md: AndroidSymbol; label: StringKey }> = {
  opening: { sf: 'clock.arrow.circlepath', md: 'history', label: 'tx.opening' },
  purchase: { sf: 'bag.fill', md: 'shopping_bag', label: 'tx.purchase' },
  sale: { sf: 'arrow.down.left', md: 'south_west', label: 'tx.sale' },
  topUp: { sf: 'plus', md: 'add', label: 'tx.topUp' },
  payout: { sf: 'building.columns.fill', md: 'account_balance', label: 'tx.payout' },
};

export default function AccountScreen() {
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const me = useActiveBusiness();
  const transactions = useAppStore((s) => s.transactions);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const connectBank = useAppStore((s) => s.connectBank);
  const payOut = useAppStore((s) => s.payOut);
  const logout = useAppStore((s) => s.logout);
  const [notice, setNotice] = useState<string | null>(null);

  const mine = useMemo(
    () => transactions.filter((tx) => tx.businessId === me.id).sort((a, b) => b.createdAt - a.createdAt),
    [transactions, me.id],
  );
  const canPayOut = me.bankConnected && me.walletBalance > 0;

  const confirmPayOut = () => {
    if (!canPayOut) return;
    const amount = formatEUR(me.walletBalance, lang);
    Alert.alert(t('wallet.payOutConfirmTitle', { amount }), t('wallet.payOutConfirmBody'), [
      { text: t('wallet.cancel'), style: 'cancel' },
      {
        text: t('wallet.payOut'),
        onPress: () => {
          const paid = payOut();
          haptics.success();
          setNotice(t('wallet.paidOut', { amount: formatEUR(paid, lang) }));
          setTimeout(() => setNotice(null), 4000);
        },
      },
    ]);
  };

  return (
    <Screen title={t('account.title')}>
      {/* Wallet */}
      <Animated.View entering={enterUp(60)}>
        <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wallet}>
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 340 230" preserveAspectRatio="xMidYMid slice">
            <Path d="M 140 250 C 200 70, 330 70, 390 250" stroke={CREAM} strokeWidth={1} opacity={0.12} fill="none" />
            <Path d="M 180 250 C 225 120, 320 120, 365 250" stroke={CREAM} strokeWidth={1} opacity={0.08} fill="none" />
          </Svg>
          <View style={styles.walletHeader}>
            <Txt variant="label" tint={CREAM}>
              {t('wallet.title')}
            </Txt>
            <Icon sf="wallet.bifold.fill" md="account_balance_wallet" size={18} color={CREAM_MUTED} />
          </View>
          <AnimatedNumber
            value={me.walletBalance}
            format={(n) => formatEUR(n, lang)}
            variant="display"
            tint={CREAM}
            style={styles.balance}
          />
          <Txt variant="caption" tint={CREAM_MUTED}>
            {t('wallet.note')}
          </Txt>
          <View style={styles.walletButtons}>
            <PressableScale onPress={() => router.push('/top-up')} style={[styles.walletButton, { backgroundColor: CREAM }]}>
              <Icon sf="plus" md="add" size={14} color="#1A2B21" weight="bold" />
              <Txt variant="bodyMedium" tint="#1A2B21" style={styles.walletButtonText}>
                {t('wallet.topUp')}
              </Txt>
            </PressableScale>
            <PressableScale
              onPress={confirmPayOut}
              disabled={!canPayOut}
              style={[styles.walletButton, styles.walletButtonOutline, !canPayOut && styles.disabled]}>
              <Icon sf="arrow.down.to.line" md="download" size={14} color={CREAM} weight="bold" />
              <Txt variant="bodyMedium" tint={CREAM} style={styles.walletButtonText}>
                {t('wallet.payOut')}
              </Txt>
            </PressableScale>
          </View>
          {!me.bankConnected && (
            <Txt variant="caption" tint={CREAM_MUTED} style={styles.walletHint}>
              {t('wallet.connectFirst')}
            </Txt>
          )}
        </LinearGradient>
      </Animated.View>

      {notice && (
        <Animated.View
          entering={enterUp(0, 300)}
          exiting={FadeOut.duration(200)}
          style={[styles.notice, { backgroundColor: theme.positiveSoft }]}>
          <Icon sf="checkmark.circle.fill" md="check_circle" size={18} color={theme.positive} />
          <Txt variant="bodyMedium" tint={theme.positive}>
            {notice}
          </Txt>
        </Animated.View>
      )}

      {/* Bank */}
      <Animated.View
        entering={enterUp(110)}
        layout={layoutTransition}
        style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Txt variant="label" color="inkFaint">
          {t('wallet.bank')}
        </Txt>
        {me.bankConnected ? (
          <View style={styles.bankRow}>
            <View style={[styles.iconCircle, { backgroundColor: theme.surfaceAlt }]}>
              <Icon sf="building.columns.fill" md="account_balance" size={16} color={theme.ink} />
            </View>
            <Txt variant="bodyMedium" style={styles.flex}>
              {t('wallet.bankConnected')}
            </Txt>
            <Icon sf="checkmark.seal.fill" md="verified" size={20} color={theme.positive} />
          </View>
        ) : (
          <PressableScale
            onPress={() => {
              connectBank();
              haptics.success();
            }}
            style={[styles.connectButton, { backgroundColor: theme.primary }]}>
            <Icon sf="building.columns.fill" md="account_balance" size={15} color={theme.onPrimary} />
            <Txt variant="bodyMedium" tint={theme.onPrimary}>
              {t('wallet.connectBank')}
            </Txt>
          </PressableScale>
        )}
        <Txt variant="caption" color="inkFaint" style={styles.bankHint}>
          {t('wallet.bankHint')}
        </Txt>
      </Animated.View>

      {/* Activity */}
      <Animated.View
        entering={enterUp(160)}
        layout={layoutTransition}
        style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Txt variant="label" color="inkFaint">
          {t('wallet.activity')}
        </Txt>
        <View style={styles.activity}>
          {mine.slice(0, 12).map((tx, index) => (
            <ActivityRow key={tx.id} tx={tx} index={index} />
          ))}
        </View>
      </Animated.View>

      {/* Business + language */}
      <Animated.View
        entering={enterUp(210)}
        layout={layoutTransition}
        style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Txt variant="label" color="inkFaint">
          {t('account.business')}
        </Txt>
        <View style={styles.businessRow}>
          <CategoryBadge category={me.category} size={48} />
          <View style={styles.flex}>
            <Txt variant="headline">{me.name}</Txt>
            <Txt variant="caption" color="inkMuted">
              {me.district} · {t(`category.${me.category}`)}
            </Txt>
          </View>
          <PressableScale
            onPress={() => router.push('/switch-business')}
            style={[styles.changeButton, { backgroundColor: theme.surfaceAlt }]}>
            <Txt variant="caption">{t('account.change')}</Txt>
          </PressableScale>
        </View>
      </Animated.View>

      <Animated.View
        entering={enterUp(250)}
        layout={layoutTransition}
        style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Txt variant="label" color="inkFaint">
          {t('account.language')}
        </Txt>
        <View style={styles.languageRow}>
          <Segmented<Language>
            value={lang}
            onChange={setLanguage}
            options={[
              { value: 'en', label: 'English' },
              { value: 'de', label: 'Deutsch' },
            ]}
          />
        </View>
      </Animated.View>

      <Animated.View entering={enterUp(290)} layout={layoutTransition}>
        <PressableScale onPress={logout} style={[styles.logout, { borderColor: theme.line }]}>
          <Icon sf="rectangle.portrait.and.arrow.right" md="logout" size={16} color={theme.inkMuted} />
          <Txt variant="bodyMedium" color="inkMuted">
            {t('account.logout')}
          </Txt>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}

function ActivityRow({ tx, index }: { tx: Transaction; index: number }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const now = useNow(60_000);
  const style = TX_STYLE[tx.kind];
  const incoming = tx.amount >= 0;

  return (
    <Animated.View entering={enterUp(Math.min(index, 6) * 40, 360)} layout={layoutTransition} style={styles.txRow}>
      <View style={[styles.iconCircle, { backgroundColor: incoming ? theme.positiveSoft : theme.surfaceAlt }]}>
        <Icon sf={style.sf} md={style.md} size={15} color={incoming ? theme.positive : theme.inkMuted} />
      </View>
      <View style={styles.flex}>
        <Txt variant="bodyMedium" numberOfLines={1}>
          {t(style.label)}
        </Txt>
        <Txt variant="caption" color="inkFaint" numberOfLines={1}>
          {[
            lang === 'de' && tx.detailDe ? tx.detailDe : tx.detail,
            formatActivityTime(tx.createdAt, now, lang, t('time.today'), t('time.yesterday')),
          ]
            .filter(Boolean)
            .join(' · ')}
        </Txt>
      </View>
      <Txt variant="bodyMedium" tint={incoming ? theme.positive : theme.ink} style={styles.txAmount}>
        {incoming ? '+' : '−'}
        {formatEUR(Math.abs(tx.amount), lang)}
      </Txt>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wallet: { borderRadius: Radius.xl, padding: Spacing.xl, overflow: 'hidden' },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balance: { fontFamily: Fonts.sansSemiBold, fontSize: 48, lineHeight: 56, letterSpacing: -1, marginTop: Spacing.md, marginBottom: Spacing.xs },
  walletButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  walletButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: Radius.pill,
  },
  walletButtonOutline: { borderWidth: 1, borderColor: 'rgba(246,240,228,0.5)' },
  walletButtonText: { fontFamily: Fonts.sansSemiBold },
  disabled: { opacity: 0.45 },
  walletHint: { marginTop: Spacing.sm, textAlign: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg },
  card: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md },
  bankHint: { marginTop: Spacing.md },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: 13,
    borderRadius: Radius.pill,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  activity: { marginTop: Spacing.sm },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  txAmount: { fontVariant: ['tabular-nums'] },
  businessRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md },
  changeButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill },
  languageRow: { marginTop: Spacing.md },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
