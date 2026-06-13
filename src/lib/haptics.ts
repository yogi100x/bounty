import * as Haptics from 'expo-haptics';

/**
 * Named haptic helpers per DESIGN-SPEC §4.
 * All are async fire-and-forget and swallow errors so a missing haptics
 * engine (web, simulator, silent mode) never crashes the UI.
 */

/** Light impact — selection, chip toggle. */
export async function hapticTap(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // no-op
  }
}

/** Success notification — habit complete, redemption. */
export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // no-op
  }
}

/** Success + a short delayed second pulse — streak milestone / badge. */
export async function hapticMilestone(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 140);
  } catch {
    // no-op
  }
}

/** Warning notification — BeReal window closing (use sparingly). */
export async function hapticWarn(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // no-op
  }
}
