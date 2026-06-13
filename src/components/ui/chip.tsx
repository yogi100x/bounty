import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { hapticTap } from '@/lib/haptics';
import { springPop } from '@/lib/motion';
import { Label } from '@/components/ui/text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  icon?: React.ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
  className?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The signature element (DESIGN-SYSTEM §5).
 * Default: surface-1 + border + secondary text. Selected: translucent violet
 * fill, violet border + text, and a soft violet glow. Toggling pops with
 * `springPop` and fires a light haptic.
 */
export function Chip({ label, selected = false, icon, onPress, className }: ChipProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(0.94, springPop, () => {
      scale.value = withSpring(1, springPop);
    });
    hapticTap();
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glow = selected
    ? {
        shadowColor: '#A78BFA',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      }
    : null;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={[animatedStyle, glow]}
      className={cn(
        'flex-row items-center gap-2 rounded-pill border px-4 py-2',
        selected ? 'border-violet-500 bg-violet-500/15' : 'border-border bg-surface-1',
        className,
      )}>
      {icon ? (
        <Feather name={icon} size={14} color={selected ? '#C4B5FD' : '#B9B9CC'} />
      ) : null}
      <Label className={selected ? 'text-violet-300' : 'text-text-secondary'}>{label}</Label>
    </AnimatedPressable>
  );
}
