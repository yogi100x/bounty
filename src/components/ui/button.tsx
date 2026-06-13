import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';
import { hapticTap } from '@/lib/haptics';
import { Label } from '@/components/ui/text';

type Variant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'children' | 'onPress'> & {
  variant?: Variant;
  label?: string;
  children?: React.ReactNode;
  icon?: React.ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Full-width by default; set false to shrink to content. */
  fullWidth?: boolean;
  className?: string;
};

const ICON_COLOR: Record<Variant, string> = {
  primary: '#F5F4FB', // text-primary
  secondary: '#F5F4FB',
  ghost: '#C4B5FD', // violet-300
};

export function Button({
  variant = 'primary',
  label,
  children,
  icon,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = true,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    hapticTap();
    onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      className={cn(
        'h-12 flex-row items-center justify-center gap-2 rounded-md px-5',
        fullWidth ? 'w-full' : 'self-start',
        variant === 'secondary' && 'border border-border bg-transparent',
        variant === 'ghost' && 'bg-transparent',
        isDisabled && 'opacity-50',
        className,
      )}
      style={({ pressed }) =>
        variant === 'primary'
          ? { backgroundColor: pressed ? '#A78BFA' : '#8B5CF6' }
          : { opacity: pressed ? 0.7 : 1 }
      }
      {...props}>
      {loading ? (
        <ActivityIndicator color={ICON_COLOR[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Feather name={icon} size={18} color={ICON_COLOR[variant]} /> : null}
          {children ?? (
            <Label
              className={cn(
                'font-sans-semibold',
                variant === 'ghost' ? 'text-violet-300' : 'text-text-primary',
              )}>
              {label}
            </Label>
          )}
        </View>
      )}
    </Pressable>
  );
}
