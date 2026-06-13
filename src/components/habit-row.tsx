import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Body, Caption } from '@/components/ui/text';
import { springPop } from '@/lib/motion';
import type { Habit } from '@/lib/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** "Daily" or e.g. "Mon, Wed, Fri" from a habit's cadence. */
function cadenceLabel(habit: Habit): string {
  if (habit.cadence.kind === 'daily') return 'Daily';
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [...habit.cadence.days].sort((a, b) => a - b);
  if (days.length === 0) return 'Weekly';
  if (days.length === 7) return 'Daily';
  return days.map((d) => names[d]).join(', ');
}

export type HabitRowProps = {
  habit: Habit;
  /** Current streak length for this habit (0 ok). */
  streak: number;
  /** Whether the habit is already proven today. */
  completed: boolean;
  /** Pressed the complete control (only fires when not completed). */
  onComplete: () => void;
};

/**
 * Today's habit as a card row (DESIGN-SYSTEM §5 / §7).
 * Left: icon tile. Middle: name + cadence/streak caption. Right: a circular
 * complete control — outlined when open, a filled violet check when proven.
 * proofRequired habits show a tiny camera hint on the open control.
 */
export function HabitRow({ habit, streak, completed, onComplete }: HabitRowProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (completed) return;
    scale.value = withSpring(0.88, springPop, () => {
      scale.value = withSpring(1, springPop);
    });
    onComplete();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Card className={completed ? 'mb-3 flex-row items-center p-4 opacity-60' : 'mb-3 flex-row items-center p-4'}>
      {/* Icon tile */}
      <View className="h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-2">
        <Feather name={habit.icon} size={18} color="#C4B5FD" />
      </View>

      {/* Name + meta */}
      <View className="ml-3 flex-1">
        <Body className="font-sans-medium text-text-primary">{habit.name}</Body>
        <Caption className="mt-0.5">
          {cadenceLabel(habit)}
          {streak > 0 ? (
            <Caption className="text-streak">{'  ·  🔥 '}{streak}</Caption>
          ) : null}
        </Caption>
      </View>

      {/* Complete control */}
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ checked: completed, disabled: completed }}
        accessibilityLabel={
          completed
            ? `${habit.name} done for today`
            : habit.proofRequired
              ? `Prove ${habit.name} with a photo`
              : `Mark ${habit.name} done`
        }
        disabled={completed}
        onPress={handlePress}
        style={[
          animatedStyle,
          {
            borderColor: completed ? '#8B5CF6' : '#2E2E40',
            backgroundColor: completed ? '#8B5CF6' : 'transparent',
          },
        ]}
        className="h-10 w-10 items-center justify-center rounded-pill border">
        {completed ? (
          <Feather name="check" size={18} color="#F5F4FB" />
        ) : habit.proofRequired ? (
          <Feather name="camera" size={16} color="#6E6E85" />
        ) : (
          <Feather name="check" size={18} color="#6E6E85" />
        )}
      </AnimatedPressable>
    </Card>
  );
}
