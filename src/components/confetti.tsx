import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// One-shot celebratory burst per DESIGN-SPEC §2/§3. Pure Reanimated — no heavy
// libs — so it stays on the UI thread and hits 60fps. A ring of small dots flies
// outward + up, scales in, then fades. Milestone => more dots + bigger radius.

const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#34D399', '#FB923C'];

type Particle = {
  angle: number; // radians
  distance: number;
  size: number;
  color: string;
  delay: number;
};

function makeParticles(count: number, radius: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    // Even spread around the circle with a little jitter for an organic burst.
    const base = (i / count) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 0.6;
    return {
      angle: base + jitter,
      distance: radius * (0.7 + Math.random() * 0.5),
      size: 6 + Math.random() * 6,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 60,
    };
  });
}

function Dot({ particle, reduced }: { particle: Particle; reduced: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      // Reduced motion: a gentle fade with no flight.
      progress.value = withTiming(1, { duration: 400 });
      return;
    }
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, particle.delay, reduced]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const dx = reduced ? 0 : Math.cos(particle.angle) * particle.distance * p;
    // Negative Y flies up; add a touch of gravity arc near the end.
    const dy = reduced
      ? 0
      : Math.sin(particle.angle) * particle.distance * p + 18 * p * p;
    const scale = reduced ? p : Math.min(1, p * 3);
    const opacity = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
    return {
      opacity,
      transform: [{ translateX: dx }, { translateY: dy }, { scale }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
}

export type ConfettiProps = {
  /** Stronger burst for streak milestones. */
  milestone?: boolean;
  /** Honor OS reduced-motion: fade in place instead of flying. */
  reducedMotion?: boolean;
};

/**
 * Anchor this inside a centered, zero-size container; particles emit from the
 * origin. Mount it when the celebration begins (it self-runs once on mount).
 */
export function Confetti({ milestone = false, reducedMotion = false }: ConfettiProps) {
  const count = milestone ? 22 : 14;
  const radius = milestone ? 150 : 110;
  const particles = makeParticles(count, radius);

  return (
    <View pointerEvents="none" style={{ width: 0, height: 0, alignItems: 'center', justifyContent: 'center' }}>
      {particles.map((p, i) => (
        <Dot key={i} particle={p} reduced={reducedMotion} />
      ))}
    </View>
  );
}

export default Confetti;
