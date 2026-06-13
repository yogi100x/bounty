import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springPop } from '@/lib/motion';
import { cn } from '@/lib/cn';

export type DotsProps = {
  /** Total number of steps. */
  total: number;
  /** Current step (1-based). Dots before this are done, the rest upcoming. */
  step: number;
  className?: string;
};

function Dot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 20 : 8);

  width.value = withSpring(active ? 20 : 8, springPop);

  const style = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <Animated.View
      style={style}
      className={cn('h-2 rounded-pill', active ? 'bg-violet-400' : 'bg-surface-2')}
    />
  );
}

/** Small progress indicator — filled violet for the current/done steps, muted for upcoming. */
export function Dots({ total, step, className }: DotsProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step }}
      className={cn('flex-row items-center gap-2', className)}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} active={i < step} />
      ))}
    </View>
  );
}
