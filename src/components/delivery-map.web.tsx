import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/icon';
import type { CategoryId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import type { LatLng } from '@/lib/route';

/** Web preview stand-in for the native map: a drawn route with the van's progress. */
export function DeliveryMap({ progress }: { route: LatLng[]; progress: number; category: CategoryId; bottomInset: number; topInset: number }) {
  const theme = useTheme();
  const x = 60 + progress * 240;
  const y = 260 - Math.sin(progress * Math.PI) * 120;
  return (
    <LinearGradient colors={[theme.surfaceAlt, theme.background]} style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 360 420" preserveAspectRatio="xMidYMin meet">
        <Path d="M 60 260 Q 180 20 300 260" stroke={theme.inkFaint} strokeWidth={3} strokeDasharray="4 8" fill="none" />
      </Svg>
      <View style={[styles.van, { left: `${(x / 360) * 100}%`, top: y, backgroundColor: theme.accent }]}>
        <Icon sf="box.truck.fill" md="local_shipping" size={18} color="#FFFFFF" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  van: {
    position: 'absolute',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
