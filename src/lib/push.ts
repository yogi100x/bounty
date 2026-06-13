import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { requestNotificationPermission } from '@/lib/notifications';

/**
 * Register the device for remote (Expo) push notifications and return the Expo
 * push token, or `null` when push isn't available.
 *
 * Push tokens only work on a physical device / dev build — never in a simulator
 * or Expo Go. Every step is guarded so this never throws: missing permission,
 * missing EAS projectId, or an unavailable native module all degrade to `null`.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Simulators / emulators can't obtain a push token.
    if (!Device.isDevice) return null;

    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn(
        'registerForPushNotificationsAsync: missing EAS projectId (extra.eas.projectId) — cannot get push token.',
      );
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token ?? null;
  } catch (err) {
    console.warn('registerForPushNotificationsAsync: failed to get push token', err);
    return null;
  }
}
