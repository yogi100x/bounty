import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dots } from '@/components/ui/dots';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display } from '@/components/ui/text';
import { useCoreActions } from '@/data/core';
import { HABIT_LIBRARY } from '@/data/habitLibrary';

export default function HabitsScreen() {
  const actions = useCoreActions();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      await actions.pickHabits([...selected]);
      router.push('/(onboarding)/notify');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <View className="py-6">
        <Dots total={4} step={3} className="mb-10" />
        <Display className="text-text-primary">Pick your{'\n'}first habit.</Display>
        <Body className="mt-3 text-text-secondary">
          One is enough to start. Add more whenever you like.
        </Body>

        <View className="mt-10 flex-row flex-wrap gap-3">
          {HABIT_LIBRARY.map((habit) => (
            <Chip
              key={habit.id}
              label={habit.name}
              icon={habit.icon}
              selected={selected.has(habit.id)}
              onPress={() => toggle(habit.id)}
            />
          ))}
        </View>
      </View>

      <View className="gap-3 pb-2 pt-4">
        <Button
          label={saving ? 'Saving…' : 'Continue'}
          icon="arrow-right"
          disabled={selected.size === 0 || saving}
          onPress={handleContinue}
        />
        <Caption className="text-center text-text-muted">
          {selected.size === 0
            ? 'Tap one to keep going.'
            : `${selected.size} picked. Nice.`}
        </Caption>
      </View>
    </Screen>
  );
}
