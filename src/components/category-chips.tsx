import { ScrollView, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Txt } from '@/components/text';
import { CategoryStyle, Radius, Spacing } from '@/constants/theme';
import { CATEGORY_IDS } from '@/data/seed';
import type { CategoryId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';

type Props = {
  value: CategoryId | 'all';
  onChange: (value: CategoryId | 'all') => void;
};

export function CategoryChips({ value, onChange }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const options: (CategoryId | 'all')[] = ['all', ...CATEGORY_IDS];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((id) => {
        const active = id === value;
        return (
          <PressableScale key={id} haptic="select" scaleTo={0.94} onPress={() => onChange(id)}>
            <Animated.View
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active ? theme.primary : theme.line,
                  transitionProperty: ['backgroundColor', 'borderColor'],
                  transitionDuration: 220,
                },
              ]}>
              {id !== 'all' && (
                <Icon
                  sf={CategoryStyle[id].symbol}
                  md={CategoryStyle[id].webSymbol}
                  size={13}
                  color={active ? theme.onPrimary : CategoryStyle[id].solid}
                />
              )}
              <Txt variant="caption" tint={active ? theme.onPrimary : theme.ink}>
                {t(`category.${id}`)}
              </Txt>
            </Animated.View>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
