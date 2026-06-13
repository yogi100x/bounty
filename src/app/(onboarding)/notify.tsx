import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dots } from '@/components/ui/dots';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display } from '@/components/ui/text';
import { useAppStore } from '@/store/useAppStore';

type Preset = { value: string; label: string };

// Stored as "HH:mm" (24h); shown in a friendly 12h label.
const PRESETS: Preset[] = [
  { value: '08:00', label: '8:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '20:00', label: '8:00 PM' },
];

export default function NotifyScreen() {
  const name = useAppStore((s) => s.user.name);
  const setProfile = useAppStore((s) => s.setProfile);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [time, setTime] = useState('20:00');

  const handleStart = () => {
    setProfile({ name, notifyTime: time });
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <View className="flex-1 justify-between py-6">
        <View>
          <Dots total={4} step={4} className="mb-10" />
          <Display className="text-text-primary">When should{'\n'}we check in?</Display>
          <Body className="mt-3 text-text-secondary">
            A gentle daily nudge to show up. Move it anytime.
          </Body>

          <View className="mt-10 flex-row flex-wrap gap-3">
            {PRESETS.map((preset) => (
              <Chip
                key={preset.value}
                label={preset.label}
                icon="clock"
                selected={time === preset.value}
                onPress={() => setTime(preset.value)}
              />
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Button label="Start" icon="check" onPress={handleStart} />
          <Caption className="text-center text-text-muted">
            You are all set{name ? `, ${name}` : ''}. Let&rsquo;s begin.
          </Caption>
        </View>
      </View>
    </Screen>
  );
}
