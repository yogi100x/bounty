import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { api } from '../../convex/_generated/api';
import { registerForPushNotificationsAsync } from '@/lib/push';

/**
 * Headless component that wires the push-notification client:
 *
 *  • When the user is signed in, register for a remote push token (once per
 *    sign-in) and persist it to Convex via `savePushToken`.
 *  • Listen for notification taps and route them: default → home tab,
 *    `data.type === 'circle'` → the Circle tab.
 *
 * Renders nothing. Everything is guarded so it never throws — remote push only
 * works on a physical device / dev build and degrades gracefully elsewhere.
 */
export function PushRegistrar(): null {
  const { isSignedIn } = useAuth();
  const savePushToken = useMutation(api.notifications.savePushToken);
  // Guards against re-running registration on every render / auth re-check.
  const registeredRef = useRef(false);

  // Register for push + save the token, once per sign-in.
  useEffect(() => {
    if (!isSignedIn) {
      // Reset so a future sign-in re-registers.
      registeredRef.current = false;
      return;
    }
    if (registeredRef.current) return;
    registeredRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (cancelled || !token) return;
        await savePushToken({ token });
      } catch {
        // Never throw — push is best-effort.
        registeredRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, savePushToken]);

  // Route notification taps.
  useEffect(() => {
    let sub: Notifications.Subscription | undefined;
    try {
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        try {
          const data = response.notification.request.content.data as
            | { type?: string }
            | undefined;
          if (data?.type === 'circle') {
            router.push('/(tabs)/circle');
          } else {
            router.push('/(tabs)');
          }
        } catch {
          // no-op — never throw from the listener
        }
      });
    } catch {
      // no-op — native module unavailable (e.g. Expo Go)
    }
    return () => {
      try {
        sub?.remove();
      } catch {
        // no-op
      }
    };
  }, []);

  return null;
}
