/**
 * Tiny className joiner. No external deps (clsx/tailwind-merge not installed).
 * NativeWind applies the LAST matching utility, so callers can override a
 * default by passing the conflicting class later (i.e. after the base classes).
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
