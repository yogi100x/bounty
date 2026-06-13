import { View } from 'react-native';

import { cn } from '@/lib/cn';
import { Label } from '@/components/ui/text';

export type AvatarProps = {
  initials: string;
  /** Diameter in px. Default 40. */
  size?: number;
  /** Brighter violet fill + ring — use for the current user / accents. */
  highlight?: boolean;
  className?: string;
};

/**
 * Circular initials avatar, violet-tinted, on the dark canvas.
 * Sizes its text relative to the diameter so it reads at any size.
 */
export function Avatar({ initials, size = 40, highlight = false, className }: AvatarProps) {
  return (
    <View
      accessibilityLabel={`${initials} avatar`}
      className={cn(
        'items-center justify-center rounded-pill border',
        highlight ? 'border-violet-400 bg-violet-500/25' : 'border-border bg-violet-500/10',
        className,
      )}
      style={{ width: size, height: size, borderRadius: size / 2 }}>
      <Label
        className={cn('font-sans-semibold', highlight ? 'text-violet-300' : 'text-lavender')}
        style={{ fontSize: Math.round(size * 0.36), lineHeight: Math.round(size * 0.42) }}>
        {initials}
      </Label>
    </View>
  );
}
