import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Segmented } from '@/components/segmented';
import { Txt } from '@/components/text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { Language } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatEUR } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/app-store';

const TOP_UP = 100;

/** Hidden controls for running FoodBridge on stage (long-press the logo on the Offers tab). */
export default function PresenterSheet() {
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = useAppStore();

  // Close first for actions that change what's on screen (new banner, sign-out, reset).
  const run = (action: () => void, close = false) => {
    if (close) router.back();
    action();
    haptics.success();
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Icon sf="sparkles" md="auto_awesome" size={18} color="#FFFFFF" />
        </View>
        <Txt variant="title">{t('presenter.title')}</Txt>
        <Txt variant="body" color="inkMuted">
          {t('presenter.body')}
        </Txt>
      </View>

      <Action sf="plus.circle.fill" md="add_circle" label={t('presenter.drop')} onPress={() => run(() => s.addLiveOffer(), true)} accent />

      <Card>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Txt variant="bodyMedium">{t('presenter.live')}</Txt>
            <Txt variant="caption" color="inkMuted">
              {t('presenter.liveBody')}
            </Txt>
          </View>
          <Switch
            value={s.liveMarket}
            onValueChange={(on) => {
              s.setLiveMarket(on);
              haptics.select();
            }}
            trackColor={{ true: theme.accent, false: theme.surfaceAlt }}
          />
        </View>
        <Txt variant="label" color="inkFaint" style={styles.label}>
          {t('presenter.every')}
        </Txt>
        <Segmented
          value={String(s.liveIntervalSec)}
          onChange={(v) => s.setLiveIntervalSec(Number(v))}
          options={[
            { value: '15', label: '15 s' },
            { value: '40', label: '40 s' },
            { value: '90', label: '90 s' },
          ]}
        />
      </Card>

      <Card>
        <Txt variant="bodyMedium">{t('presenter.delivery')}</Txt>
        <Segmented
          value={String(s.deliverySeconds)}
          onChange={(v) => s.setDeliverySeconds(Number(v))}
          options={[
            { value: '30', label: '30 s' },
            { value: '75', label: '75 s' },
            { value: '180', label: '3 min' },
          ]}
        />
        <Action sf="checkmark.circle.fill" md="check_circle" label={t('presenter.completeDeliveries')} onPress={() => run(s.completeAllDeliveries)} />
      </Card>

      <Action
        sf="creditcard.fill"
        md="credit_card"
        label={t('presenter.wallet', { amount: formatEUR(TOP_UP, lang) })}
        onPress={() => run(() => s.topUp(TOP_UP))}
      />

      <Card>
        <Txt variant="bodyMedium">{t('presenter.language')}</Txt>
        <Segmented<Language>
          value={lang}
          onChange={s.setLanguage}
          options={[
            { value: 'en', label: 'English' },
            { value: 'de', label: 'Deutsch' },
          ]}
        />
      </Card>

      <Action sf="play.circle.fill" md="replay" label={t('presenter.replay')} onPress={() => run(s.logout, true)} />
      <Action
        sf="arrow.counterclockwise"
        md="restart_alt"
        label={t('presenter.reset')}
        destructive
        onPress={() =>
          Alert.alert(t('presenter.resetConfirm'), t('presenter.resetBody'), [
            { text: t('presenter.cancel'), style: 'cancel' },
            { text: t('presenter.reset'), style: 'destructive', onPress: () => run(s.resetDemo, true) },
          ])
        }
      />
    </ScrollView>
  );
}

function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>{children}</View>;
}

type ActionProps = {
  sf: 'plus.circle.fill' | 'checkmark.circle.fill' | 'creditcard.fill' | 'play.circle.fill' | 'arrow.counterclockwise';
  md: 'add_circle' | 'check_circle' | 'credit_card' | 'replay' | 'restart_alt';
  label: string;
  onPress: () => void;
  accent?: boolean;
  destructive?: boolean;
};

function Action({ sf, md, label, onPress, accent, destructive }: ActionProps) {
  const theme = useTheme();
  const bg = accent ? theme.accent : destructive ? theme.accentSoft : theme.surfaceAlt;
  const fg = accent ? '#FFFFFF' : destructive ? theme.accent : theme.ink;
  return (
    <PressableScale haptic="none" onPress={onPress} style={[styles.action, { backgroundColor: bg }]}>
      <Icon sf={sf} md={md} size={17} color={fg} />
      <Txt variant="bodyMedium" tint={fg} style={styles.actionText}>
        {label}
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.xl, paddingTop: Spacing.xxl, gap: Spacing.md },
  header: { gap: Spacing.sm, marginBottom: Spacing.sm },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, gap: Spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  label: { marginBottom: -Spacing.xs },
  action: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg },
  actionText: { fontFamily: Fonts.sansSemiBold },
});
