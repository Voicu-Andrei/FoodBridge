import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBadge } from '@/components/category-art';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Txt } from '@/components/text';
import { enterUp } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

export default function SwitchBusinessSheet() {
  const theme = useTheme();
  const { t } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const businesses = useAppStore((s) => s.businesses);
  const switchBusiness = useAppStore((s) => s.switchBusiness);
  const me = useActiveBusiness();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
      <Txt variant="title">{t('switch.title')}</Txt>
      <Txt variant="body" color="inkMuted" style={styles.body}>
        {t('switch.body')}
      </Txt>

      <View style={styles.list}>
        {businesses.map((business, index) => {
          const current = business.id === me.id;
          return (
            <Animated.View key={business.id} entering={enterUp(index * 35, 360)}>
              <PressableScale
                haptic="select"
                onPress={() => {
                  switchBusiness(business.id);
                  router.back();
                }}
                style={[
                  styles.row,
                  { backgroundColor: theme.surface, borderColor: current ? theme.primary : theme.line },
                  current && styles.rowCurrent,
                ]}>
                <CategoryBadge category={business.category} size={42} />
                <View style={styles.rowText}>
                  <Txt variant="bodyMedium">{business.name}</Txt>
                  <Txt variant="caption" color="inkMuted">
                    {business.district} · {t(`category.${business.category}`)}
                  </Txt>
                </View>
                {current && <Icon sf="checkmark.circle.fill" md="check_circle" size={22} color={theme.positive} />}
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingTop: Spacing.xxl },
  body: { marginTop: Spacing.sm },
  list: { gap: Spacing.sm, marginTop: Spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowCurrent: { borderWidth: 1.5 },
  rowText: { flex: 1, gap: 2 },
});
