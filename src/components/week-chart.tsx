import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Txt } from '@/components/text';
import { EASE_OUT } from '@/constants/motion';
import { Fonts } from '@/constants/theme';
import type { Language } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { formatNumber } from '@/lib/format';
import { haptics } from '@/lib/haptics';

const PLOT_HEIGHT = 150;
const LABEL_SPACE = 22;
const AXIS_WIDTH = 34;
const MAX_BAR = 24;

type Props = {
  data: { day: number; kg: number }[];
  lang: Language;
  todayLabel: string;
};

/**
 * Single-series column chart (kg rescued per day). One hue in two validated steps: the
 * selected day is the darker step and carries the only value label; tap a column to select it.
 */
export function WeekChart({ data, lang, todayLabel }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(data.length - 1);

  const max = Math.max(...data.map((d) => d.kg), 1);
  const niceMax = Math.ceil(max / 100) * 100;
  const ticks = [niceMax, niceMax / 2, 0];
  const slot = width > 0 ? (width - AXIS_WIDTH) / data.length : 0;
  const barWidth = Math.min(MAX_BAR, slot * 0.55);
  const weekday = new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', { weekday: 'short' });
  const summary = data.map((d, i) => `${i === data.length - 1 ? todayLabel : weekday.format(d.day)} ${d.kg} kg`).join(', ');

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={summary}
      style={{ height: PLOT_HEIGHT + LABEL_SPACE + 24 }}>
      {/* Recessive hairline grid with rounded tick values */}
      {ticks.map((tick) => (
        <View key={tick} style={[styles.gridRow, { top: 24 + PLOT_HEIGHT * (1 - tick / niceMax) }]}>
          <Txt variant="caption" color="inkFaint" style={styles.tick}>
            {formatNumber(tick, lang)}
          </Txt>
          <View style={[styles.gridLine, { backgroundColor: theme.line }]} />
        </View>
      ))}

      <View style={[styles.plot, { left: AXIS_WIDTH }]}>
        {slot > 0 &&
          data.map((d, i) => (
            <Pressable
              key={d.day}
              onPress={() => {
                if (i !== selected) haptics.select();
                setSelected(i);
              }}
              style={[styles.slot, { width: slot }]}
              accessibilityRole="button"
              accessibilityLabel={`${i === data.length - 1 ? todayLabel : weekday.format(d.day)}: ${d.kg} kg`}>
              <View style={styles.barArea}>
                {i === selected && (
                  <Txt variant="caption" style={[styles.value, { color: theme.ink }]}>
                    {formatNumber(d.kg, lang)} kg
                  </Txt>
                )}
                <Bar
                  height={(d.kg / niceMax) * PLOT_HEIGHT}
                  width={barWidth}
                  color={i === selected ? theme.chartBarActive : theme.chartBar}
                  delay={i * 50}
                />
              </View>
              <Txt variant="caption" color={i === selected ? 'ink' : 'inkFaint'} style={styles.dayLabel}>
                {i === data.length - 1 ? todayLabel : weekday.format(d.day)}
              </Txt>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

function Bar({ height, width, color, delay }: { height: number; width: number; color: string; delay: number }) {
  const h = useSharedValue(0);

  useEffect(() => {
    h.set(withDelay(delay, withTiming(height, { duration: 650, easing: EASE_OUT })));
  }, [height, delay, h]);

  const style = useAnimatedStyle(() => ({ height: h.get() }));

  return <Animated.View style={[styles.bar, { width, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  gridRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' },
  tick: { width: AXIS_WIDTH - 6, fontSize: 10.5, textAlign: 'right', marginRight: 6, marginTop: -1 },
  gridLine: { flex: 1, height: StyleSheet.hairlineWidth },
  plot: { position: 'absolute', top: 24, right: 0, height: PLOT_HEIGHT + LABEL_SPACE, flexDirection: 'row' },
  slot: { alignItems: 'center' },
  barArea: { height: PLOT_HEIGHT, justifyContent: 'flex-end', alignItems: 'center' },
  value: { fontFamily: Fonts.sansSemiBold, fontSize: 11.5, marginBottom: 4 },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  dayLabel: { fontSize: 11, marginTop: 6 },
});
