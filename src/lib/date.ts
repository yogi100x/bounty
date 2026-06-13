// Local-date helpers (device timezone). P1 keeps this simple; P2's Convex
// streak engine will own the rigorous timezone/DST logic.

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISO(d);
}

/** Weekday for today, 0=Sun..6=Sat. */
export function todayWeekday(): number {
  return new Date().getDay();
}

/** Friendly header date, e.g. "Friday, June 13". */
export function prettyToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
