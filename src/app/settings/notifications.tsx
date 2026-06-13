import { useEffect, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Body, Caption, Heading, Label } from '@/components/ui/text';
import { useAppStore } from '@/store/useAppStore';
import { hapticTap } from '@/lib/haptics';
import type { NotifPrefs } from '@/lib/types';
import {
  cancelAllNudges,
  configureNotifications,
  requestNotificationPermission,
  scheduleDailyNudge,
} from '@/lib/notifications';

// Violet track/thumb for the toggles.
const TRACK = { false: '#26263A', true: '#7C3AED' };
const THUMB_ON = '#EDE9FE';
const THUMB_OFF = '#6B6880';

type Row = {
  key: keyof NotifPrefs;
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
  const notifPrefs = useAppStore((s) => s.notifPrefs);
  const notifyTime = useAppStore((s) => s.user.notifyTime);
  const setNotifPref = useAppStore((s) => s.setNotifPref);

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

  const enableReminders = async () => {
    const ok = await requestNotificationPermission();
    setGranted(ok);
    if (ok && notifPrefs.dailyNudge) {
      await scheduleDailyNudge(notifyTime);
    }
  };

  const toggle = async (key: keyof NotifPrefs, value: boolean) => {
    hapticTap();
    setNotifPref(key, value);
    if (key === 'dailyNudge') {
      if (value) {
        await scheduleDailyNudge(notifyTime);
      } else {
        await cancelAllNudges();
      }
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
      <View className="gap-3">
        {ROWS.map((row) => {
          const value = notifPrefs[row.key];
          return (
            <Card key={row.key} className="flex-row items-start gap-3 py-4">
              <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-surface-2">
                <Feather name={row.icon} size={18} color="#C4B5FD" />
              </View>
              <View className="flex-1 pr-1">
                <Label className="text-[15px]">{row.label}</Label>
                <Caption className="mt-1 text-text-secondary">{row.caption(notifyTime)}</Caption>
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

      <Caption className="mt-6 text-center text-text-muted">
        Change your check-in time anytime from your profile.
      </Caption>
    </Screen>
  );
}
