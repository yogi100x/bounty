import { useEffect, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import { Screen } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Body, Caption, Heading, Label } from '@/components/ui/text';
import { hapticTap } from '@/lib/haptics';
import {
  cancelAllNudges,
  configureNotifications,
  requestNotificationPermission,
  scheduleDailyNudge,
} from '@/lib/notifications';
import { registerForPushNotificationsAsync } from '@/lib/push';

// Violet track/thumb for the toggles.
const TRACK = { false: '#26263A', true: '#7C3AED' };
const THUMB_ON = '#EDE9FE';
const THUMB_OFF = '#6B6880';

// Default daily-nudge time when the user turns the toggle on.
const DEFAULT_NUDGE_TIME = '20:00';

type RowKey = 'dailyNudge' | 'streakAtRisk' | 'circleActivity' | 'bereal';

type Row = {
  key: RowKey;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  caption: (time: string) => string;
};

const ROWS: Row[] = [
  {
    key: 'dailyNudge',
    icon: 'sunrise',
    label: 'Daily nudge',
    caption: (time) => `A gentle reminder at ${time} to come back and show up.`,
  },
  {
    key: 'streakAtRisk',
    icon: 'zap',
    label: 'Streak at risk',
    caption: () => "An evening heads-up if today's still open — only when it counts.",
  },
  {
    key: 'circleActivity',
    icon: 'users',
    label: 'Circle activity',
    caption: () => 'When someone in your Circle shows up or cheers you on.',
  },
  {
    key: 'bereal',
    icon: 'camera',
    label: 'BeReal prompt',
    caption: () => 'A once-a-day moment to capture proof, together with your Circle.',
  },
];

export default function NotificationsSettingsScreen() {
  const prefs = useQuery(api.notifications.getPrefs);
  const update = useMutation(api.notifications.updatePrefs);

  const [granted, setGranted] = useState(true);

  // Configure the handler + reflect current OS permission on mount.
  useEffect(() => {
    configureNotifications();
    let active = true;
    requestNotificationPermission()
      .then((ok) => {
        // Don't *prompt* on mount — but if already granted, hide the card.
        // requestNotificationPermission returns true when already granted.
        if (active) setGranted(ok);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // The active daily-nudge time (caption + scheduling), defaulting to 20:00.
  const nudgeTime = prefs?.dailyNudgeTime ?? DEFAULT_NUDGE_TIME;

  // Map Convex prefs onto the row toggle values.
  const valueFor = (key: RowKey): boolean => {
    if (!prefs) return false;
    switch (key) {
      case 'dailyNudge':
        return prefs.dailyNudgeTime != null;
      case 'streakAtRisk':
        return prefs.streakAtRisk;
      case 'circleActivity':
        return prefs.circleActivity;
      case 'bereal':
        return prefs.berealEnabled;
    }
  };

  const enableReminders = async () => {
    const ok = await requestNotificationPermission();
    setGranted(ok);
    if (!ok) return;
    // Save the remote push token so server-driven push can reach this device.
    await registerForPushNotificationsAsync();
    // Schedule the local daily nudge if it's currently enabled.
    if (prefs?.dailyNudgeTime != null) {
      await scheduleDailyNudge(prefs.dailyNudgeTime);
    }
  };

  const toggle = async (key: RowKey, value: boolean) => {
    hapticTap();
    try {
      switch (key) {
        case 'dailyNudge':
          if (value) {
            await update({ dailyNudgeTime: DEFAULT_NUDGE_TIME });
            await scheduleDailyNudge(DEFAULT_NUDGE_TIME);
          } else {
            await update({ dailyNudgeTime: null });
            await cancelAllNudges();
          }
          break;
        case 'streakAtRisk':
          await update({ streakAtRisk: value });
          break;
        case 'circleActivity':
          await update({ circleActivity: value });
          break;
        case 'bereal':
          await update({ berealEnabled: value });
          break;
      }
    } catch {
      // no-op — keep the UI responsive; Convex query will reconcile.
    }
  };

  return (
    <Screen scroll>
      {/* Header: back + title */}
      <View className="mb-4 flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => {
            hapticTap();
            router.back();
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-1">
          <Feather name="arrow-left" size={20} color="#C9C5D6" />
        </Pressable>
        <Heading className="font-display text-[28px] leading-[34px]">Notifications</Heading>
      </View>

      {/* Explainer — quiet by default, you're in control. */}
      <Body className="mb-6 text-text-secondary">
        Bounty stays quiet by default. Turn on only what helps you show up — you're always in
        control, and nothing here will ever shame you.
      </Body>

      {/* Permission prompt (only when not granted) */}
      {!granted ? (
        <Card className="mb-6 items-start">
          <View className="mb-3 h-11 w-11 items-center justify-center rounded-full bg-violet-500/15">
            <Feather name="bell" size={20} color="#C4B5FD" />
          </View>
          <Heading className="text-[18px] leading-[24px]">Turn on reminders</Heading>
          <Caption className="mb-4 mt-1 text-text-secondary">
            Allow notifications so your daily nudge can find you. You can fine-tune the rest below.
          </Caption>
          <Button label="Turn on reminders" icon="bell" onPress={enableReminders} />
        </Card>
      ) : null}

      {/* Preference rows */}
      {prefs === undefined ? (
        <Caption className="mt-2 text-center text-text-muted">Loading your preferences…</Caption>
      ) : (
        <View className="gap-3">
          {ROWS.map((row) => {
            const value = valueFor(row.key);
            return (
              <Card key={row.key} className="flex-row items-start gap-3 py-4">
                <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-surface-2">
                  <Feather name={row.icon} size={18} color="#C4B5FD" />
                </View>
                <View className="flex-1 pr-1">
                  <Label className="text-[15px]">{row.label}</Label>
                  <Caption className="mt-1 text-text-secondary">{row.caption(nudgeTime)}</Caption>
                </View>
                <Switch
                  value={value}
                  onValueChange={(v) => toggle(row.key, v)}
                  trackColor={TRACK}
                  thumbColor={value ? THUMB_ON : THUMB_OFF}
                  ios_backgroundColor={TRACK.false}
                  accessibilityLabel={row.label}
                />
              </Card>
            );
          })}
        </View>
      )}

      <Caption className="mt-6 text-center text-text-muted">
        Change your check-in time anytime from your profile.
      </Caption>
    </Screen>
  );
}
