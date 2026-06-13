import * as Notifications from 'expo-notifications';

/**
 * Local notification helpers (P1, client-side).
 *
 * Full server-driven push (Expo Push API + Convex cron) is P2/backend per
 * IMPLEMENTATION-PLAN §5. Here we wire the SETTINGS UI + a local daily-nudge
 * fallback that works without the server loop. Everything is wrapped in
 * try/catch and no-ops on failure so a missing native module (Expo Go on
 * SDK 56 has limited local-notification support) never crashes the app.
 */

const DAILY_NUDGE_ID = 'bounty-daily-nudge';

/** Set the foreground handler: show a banner, no badge, no sound. */
export function configureNotifications(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // no-op — native module unavailable
  }
}

/** Request permission and return whether it was granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch {
    return false;
  }
}

/** Parse "HH:mm" → { hour, minute }, clamped to valid ranges. Defaults to 20:00. */
function parseTime(timeHHmm: string): { hour: number; minute: number } {
  const [h, m] = (timeHHmm ?? '').split(':');
  const hour = Number(h);
  const minute = Number(m);
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 20,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  };
}

/**
 * Cancel any existing nudge and schedule a repeating daily local notification
 * at the given time. Warm, zero-guilt copy (DESIGN-SPEC §5).
 */
export async function scheduleDailyNudge(timeHHmm: string): Promise<void> {
  try {
    await cancelAllNudges();
    const { hour, minute } = parseTime(timeHHmm);
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_NUDGE_ID,
      content: {
        title: 'Time to show up',
        body: 'Your streak is waiting.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // no-op — scheduling unavailable (e.g. Expo Go on SDK 56)
  }
}

/** Cancel all scheduled local notifications. */
export async function cancelAllNudges(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // no-op
  }
}
