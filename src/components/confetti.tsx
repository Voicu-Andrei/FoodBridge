import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

type Piece = {
  vx: number;
  vy: number;
  spin: number;
  width: number;
  height: number;
  color: string;
};

const GRAVITY = 1500;

/** Deterministic pseudo-random in [0, 1) so the burst is stable across renders. */
function rand(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function makePieces(count: number, colors: string[]): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (-160 + rand(i, 1) * 140) * (Math.PI / 180);
    const speed = 520 + rand(i, 2) * 480;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: (rand(i, 3) - 0.5) * 900,
      width: 6 + rand(i, 4) * 5,
      height: 10 + rand(i, 5) * 6,
      color: colors[i % colors.length],
    };
  });
}

/** One-shot confetti burst from a point, falling under gravity and fading out. */
export function Confetti({ x, y, colors, count = 44 }: { x: number; y: number; colors: string[]; count?: number }) {
  const progress = useSharedValue(0);
  const pieces = makePieces(count, colors);

  useEffect(() => {
    progress.set(withTiming(1, { duration: 2400, easing: Easing.linear }));
  }, [progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} progress={progress} originX={x} originY={y} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, progress, originX, originY }: { piece: Piece; progress: SharedValue<number>; originX: number; originY: number }) {
  const style = useAnimatedStyle(() => {
    const t = progress.get() * 1.6;
    return {
      opacity: progress.get() < 0.7 ? 1 : 1 - (progress.get() - 0.7) / 0.3,
      transform: [
        { translateX: piece.vx * t * (1 - 0.25 * t) },
        { translateY: piece.vy * t + GRAVITY * t * t * 0.5 },
        { rotate: `${piece.spin * t}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: originX - piece.width / 2,
          top: originY - piece.height / 2,
          width: piece.width,
          height: piece.height,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', borderRadius: 2 },
});
