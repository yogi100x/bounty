import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { HabitRow } from '@/components/habit-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading, Label, Title } from '@/components/ui/text';
import { prettyToday } from '@/lib/date';
import { hapticMilestone, hapticSuccess } from '@/lib/haptics';
import type { Habit } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

const MOODS = ['Energized', 'Tired', 'Focused', 'Calm'] as const;

export default function TodayScreen() {
  // Live store reads — completing a habit re-renders the rows + hero instantly.
  const habits = useAppStore((s) => s.habits);
  const completions = useAppStore((s) => s.completions);
  const streaks = useAppStore((s) => s.streaks);
  const availablePoints = useAppStore((s) => s.availablePoints);

  const [mood, setMood] = useState<string | null>(null);

  // Subscribing to `habits`/`completions` above means these getState() reads run
  // against fresh state and re-render whenever a habit is completed/added.
  void habits;
  void completions;
  const due = useAppStore.getState().habitsDueToday();
  const isCompletedToday = (id: string) => useAppStore.getState().isCompletedToday(id);

  const bestStreak = Object.values(streaks).reduce((max, s) => Math.max(max, s.current), 0);
  const allDone = due.length > 0 && due.every((h) => isCompletedToday(h.id));

  const handleComplete = (habit: Habit) => {
    if (habit.proofRequired) {
      // Capture screen owns completion after the photo.
      router.push({ pathname: '/capture', params: { habitId: habit.id } });
      return;
    }
    const award = useAppStore.getState().completeHabitToday(habit.id);
    if (award.isMilestone) hapticMilestone();
    else hapticSuccess();
    router.push('/award');
  };

  return (
    <Screen scroll>
      {/* Header */}
      <View className="mb-1 mt-2">
        <Caption>{prettyToday()}</Caption>
        <Title className="mt-1">Today</Title>
      </View>

      {/* Streak hero */}
      <Card className="mt-4">
        <View className="flex-row items-end justify-between">
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-pill"
              style={{
                backgroundColor: 'rgba(251,146,60,0.12)',
                shadowColor: '#FB923C',
                shadowOpacity: 0.35,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 0 },
                elevation: 6,
              }}>
              <Feather name="trending-up" size={24} color="#FB923C" />
            </View>
            <View>
              <Display className="text-streak">{bestStreak}</Display>
              <Label className="mt-0.5 text-text-secondary">day streak</Label>
            </View>
          </View>

          {/* Points balance pill */}
          <View
            className="flex-row items-center gap-1.5 rounded-pill border border-violet-500 px-3.5 py-2"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
            <Feather name="zap" size={15} color="#C4B5FD" />
            <Label className="text-violet-300">{availablePoints}</Label>
          </View>
        </View>
      </Card>

      {/* Habits */}
      <View className="mb-3 mt-7 flex-row items-baseline justify-between">
        <Heading>Today&rsquo;s habits</Heading>
        <Caption>
          {due.filter((h) => isCompletedToday(h.id)).length}/{due.length} done
        </Caption>
      </View>

      {allDone ? (
        <Card className="mb-3 items-center px-5 py-7">
          <View
            className="mb-3 h-12 w-12 items-center justify-center rounded-pill"
            style={{ backgroundColor: 'rgba(52,211,153,0.12)' }}>
            <Feather name="check" size={24} color="#34D399" />
          </View>
          <Heading className="text-center">You&rsquo;re clear for today</Heading>
          <Body className="mt-1 text-center text-text-secondary">
            Every habit proven — your streak is safe. See you tomorrow.
          </Body>
        </Card>
      ) : null}

      {due.length === 0 ? (
        <Card className="mb-3 items-center px-5 py-7">
          <Body className="text-center text-text-secondary">
            Nothing scheduled today. Add a habit to start a streak.
          </Body>
        </Card>
      ) : (
        due.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            streak={streaks[h.id]?.current ?? 0}
            completed={isCompletedToday(h.id)}
            onComplete={() => handleComplete(h)}
          />
        ))
      )}

      <Button
        variant="secondary"
        icon="plus"
        label="Add habit"
        className="mt-1"
        onPress={() => router.push('/add-habit')}
      />

      {/* Mood check-in flourish */}
      <Heading className="mb-1 mt-7">How are you feeling?</Heading>
      <Body className="mb-3 text-text-secondary">A quick check-in — no wrong answer.</Body>
      <View className="flex-row flex-wrap gap-2">
        {MOODS.map((m) => (
          <Chip
            key={m}
            label={m}
            selected={mood === m}
            onPress={() => setMood((cur) => (cur === m ? null : m))}
          />
        ))}
      </View>
    </Screen>
  );
}
