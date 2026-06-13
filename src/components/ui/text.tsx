import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

export type TextProps = RNTextProps & {
  className?: string;
};

/**
 * Typed text components on the type scale (DESIGN-SYSTEM §3).
 * Base classes come first so a caller's `className` (passed last) wins for
 * any conflicting utility — e.g. override color with `className="text-violet-300"`.
 */

/** Display XL — Clash Display, ~40. Hero numbers, celebration. */
export function Display({ className, ...props }: TextProps) {
  return (
    <RNText
      className={cn('font-display-bold text-[40px] leading-[44px] text-text-primary', className)}
      {...props}
    />
  );
}

/** Title — Clash Display, ~28. Screen titles. */
export function Title({ className, ...props }: TextProps) {
  return (
    <RNText
      className={cn('font-display text-[28px] leading-[34px] text-text-primary', className)}
      {...props}
    />
  );
}

/** Heading — Inter bold, 20. Section headers. */
export function Heading({ className, ...props }: TextProps) {
  return (
    <RNText
      className={cn('font-sans-bold text-[20px] leading-[26px] text-text-primary', className)}
      {...props}
    />
  );
}

/** Body — Inter, 16. Paragraph / primary copy. */
export function Body({ className, ...props }: TextProps) {
  return (
    <RNText
      className={cn('font-sans text-[16px] leading-[24px] text-text-primary', className)}
      {...props}
    />
  );
}

/** Label — Inter medium, 14. Chips, buttons, dense labels. */
export function Label({ className, ...props }: TextProps) {
  return (
    <RNText
      className={cn('font-sans-medium text-[14px] leading-[20px] text-text-primary', className)}
      {...props}
    />
  );
}

/** Caption — Inter, 12, muted. Timestamps, hints. */
export function Caption({ className, ...props }: TextProps) {
  return (
    <RNText
      className={cn('font-sans text-[12px] leading-[16px] text-text-muted', className)}
      {...props}
    />
  );
}
