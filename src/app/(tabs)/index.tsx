import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading, Label, Title } from '@/components/ui/text';
import { hapticSuccess } from '@/lib/haptics';

type Habit = {
  id: string;
  name: string;
  cadence: string;
  icon: React.ComponentProps<typeof Feather>['name'];
};

const HABITS: Habit[] = [
  { id: 'read', name: 'Read 10 pages', cadence: 'Every day', icon: 'book-open' },
  { id: 'move', name: 'Move your body', cadence: 'Mon, Wed, Fri', icon: 'activity' },
  { id: 'water', name: 'Drink water', cadence: 'Every day', icon: 'droplet' },
];

const MOODS: { id: string; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { id: 'calm', label: 'Calm', icon: 'feather' },
  { id: 'focused', label: 'Focused', icon: 'target' },
  { id: 'tired', label: 'Tired', icon: 'moon' },
  { id: 'happy', label: 'Happy', icon: 'smile' },
];

const TODAY = new Date('2026-06-13T09:00:00').toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

function HabitRow({ habit }: { habit: Habit }) {
  const [done, setDone] = useState(false);

  const toggle = () => {
    if (!done) hapticSuccess();
    setDone((d) => !d);
  };

  return (
    <Card className="mb-3 flex-row items-center p-4">
      <View className="h-11 w-11 items-center justify-center rounded-sm border border-border bg-surface-2">
        <Feather name={habit.icon} size={18} color="#C4B5FD" />
      </View>
      <View className="ml-3 flex-1">
        <Label className="text-text-primary">{habit.name}</Label>
        <Caption className="mt-0.5">{habit.cadence}</Caption>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={done ? `${habit.name} done` : `Mark ${habit.name} done`}
        accessibilityState={{ checked: done }}
        onPress={toggle}
        className="h-9 w-9 items-center justify-center rounded-pill border"
        style={{
          borderColor: done ? '#8B5CF6' : '#2E2E40',
          backgroundColor: done ? 'rgba(139,92,246,0.15)' : 'transparent',
        }}>
        <Feather name="check" size={18} color={done ? '#C4B5FD' : '#6E6E85'} />
      </Pressable>
    </Card>
  );
}

export default function TodayScreen() {
  const [mood, setMood] = useState<string | null>('focused');

  return (
    <Screen scroll>
      <View className="mb-1 mt-2">
        <Title>Today</Title>
        <Caption className="mt-1">{TODAY}</Caption>
      </View>

      {/* Streak hero */}
      <Card className="mt-4 flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <Feather name="zap" size={22} color="#FB923C" />
            <Display className="text-streak">12</Display>
          </View>
          <Label className="mt-1 text-text-secondary">day streak</Label>
        </View>
        <View className="flex-row items-center gap-2 rounded-pill border border-border bg-surface-2 px-4 py-2">
          <Feather name="award" size={16} color="#C4B5FD" />
          <Label className="text-violet-300">340 pts</Label>
        </View>
      </Card>

      {/* Habits */}
      <Heading className="mb-3 mt-7">Your habits</Heading>
      {HABITS.map((h) => (
        <HabitRow key={h.id} habit={h} />
      ))}

      {/* Mood chips */}
      <Heading className="mb-1 mt-5">How are you feeling?</Heading>
      <Body className="mb-3 text-text-secondary">No wrong answer — just a check-in.</Body>
      <View className="flex-row flex-wrap gap-2">
        {MOODS.map((m) => (
          <Chip
            key={m.id}
            label={m.label}
            icon={m.icon}
            selected={mood === m.id}
            onPress={() => setMood((cur) => (cur === m.id ? null : m.id))}
          />
        ))}
      </View>
    </Screen>
  );
}
