import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/text';
import { Radius } from '@/constants/theme';
import type { OrderStatus } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';

export function StatusChip({ status }: { status: OrderStatus }) {
  const theme = useTheme();
  const { t } = useT();
  const look = {
    reserved: { bg: theme.accentSoft, fg: theme.accent, sf: 'bag.fill', md: 'shopping_bag', label: t('orders.status.reserved') },
    onTheWay: { bg: theme.accentSoft, fg: theme.accent, sf: 'box.truck.fill', md: 'local_shipping', label: t('orders.status.onTheWay') },
    completed: { bg: theme.positiveSoft, fg: theme.positive, sf: 'checkmark.circle.fill', md: 'check_circle', label: t('orders.status.completed') },
  } as const;
  const s = look[status];

  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <Icon sf={s.sf} md={s.md} size={11} color={s.fg} />
      <Txt variant="caption" tint={s.fg} style={styles.text}>
        {s.label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  text: { fontSize: 11.5 },
});
