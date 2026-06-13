import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export type CardProps = ViewProps & {
  className?: string;
};

/** Elevated content card — surface-1, big radius, hairline border (DESIGN-SYSTEM §5). */
export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn('rounded-lg border border-border bg-surface-1 p-5', className)}
      {...props}
    />
  );
}

/** Plain, fully configurable surface wrapper — no opinions beyond passthrough. */
export function Surface({ className, ...props }: CardProps) {
  return <View className={className} {...props} />;
}
