import { LinearGradient } from 'expo-linear-gradient';
import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/text';
import { enterUp } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';

const CREAM = '#F6F0E4';

type SoonCardProps = {
  title: string;
  body: string;
  sf: SFSymbol;
  md: AndroidSymbol;
  delay?: number;
  /** Pill text; defaults to "coming in the next build". */
  badge?: string;
};

/** Gradient info card, used where a feature isn't available (e.g. the map in the web preview). */
export function SoonCard({ title, body, sf, md, delay = 0, badge }: SoonCardProps) {
  const theme = useTheme();
  const { t } = useT();

  return (
    <Animated.View entering={enterUp(delay)}>
      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 340 220" preserveAspectRatio="xMidYMid slice">
          <Path d="M 120 240 C 180 60, 320 60, 380 240" stroke={CREAM} strokeWidth={1} opacity={0.12} fill="none" />
        </Svg>
        <View style={styles.ghost}>
          <Icon sf={sf} md={md} size={150} color="rgba(246,240,228,0.08)" />
        </View>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(246,240,228,0.12)' }]}>
          <Icon sf={sf} md={md} size={22} color={CREAM} />
        </View>
        <Txt variant="title" tint={CREAM} style={styles.title}>
          {title}
        </Txt>
        <Txt variant="body" tint="rgba(246,240,228,0.72)">
          {body}
        </Txt>
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Txt variant="label" tint="#FFFFFF">
            {badge ?? t('soon.badge')}
          </Txt>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.xl, padding: Spacing.xl, overflow: 'hidden' },
  ghost: { position: 'absolute', right: -24, top: -18, transform: [{ rotate: '-12deg' }] },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
});
