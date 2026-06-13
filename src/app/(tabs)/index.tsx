import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import type { Id } from '../../../convex/_generated/dataModel';
import { HabitRow } from '@/components/habit-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading, Label, Title } from '@/components/ui/text';
import { useCoreActions, useSnapshot, type SnapshotHabit } from '@/data/core';
import { prettyToday } from '@/lib/date';
import { hapticMilestone, hapticSuccess } from '@/lib/haptics';
import type { Habit } from '@/lib/types';

const MOODS = ['Energized', 'Tired', 'Focused', 'Calm'] as const;

export default function TodayScreen() {
  const snap = useSnapshot();
  const actions = useCoreActions();

  const [mood, setMood] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (snap === undefined) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Caption>Loading…</Caption>
        </View>
      </Screen>
    );
  }

  const dueIds = new Set(snap.dueHabitIds);
  const due = snap.habits.filter((h) => dueIds.has(h._id));
  const allDone = due.length > 0 && due.every((h) => h.doneToday);
  const doneCount = due.filter((h) => h.doneToday).length;

  const handleComplete = async (habit: SnapshotHabit) => {
    if (habit.proofRequired) {
      router.push({ pathname: '/capture', params: { habitId: habit._id } });
      return;
    }
    if (busyId) return;
    setBusyId(habit._id);
    try {
      const award = await actions.completeHabit(habit._id as Id<'habits'>);
      if (award.isMilestone) hapticMilestone();
      else hapticSuccess();
      router.push('/award');
    } finally {
      setBusyId(null);
    }
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
              <Display className="text-streak">{snap.bestCurrentStreak}</Display>
              <Label className="mt-0.5 text-text-secondary">day streak</Label>
            </View>
          </View>

          {/* Points balance pill */}
          <View
            className="flex-row items-center gap-1.5 rounded-pill border border-violet-500 px-3.5 py-2"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
            <Feather name="zap" size={15} color="#C4B5FD" />
            <Label className="text-violet-300">{snap.points}</Label>
          </View>
        </View>
      </Card>

      {/* Habits */}
      <View className="mb-3 mt-7 flex-row items-baseline justify-between">
        <Heading>Today&rsquo;s habits</Heading>
        <Caption>
          {doneCount}/{due.length} done
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
            key={h._id}
            habit={
              {
                id: h._id,
                name: h.name,
                icon: h.icon,
                category: h.category,
                cadence: h.cadence,
                proofRequired: h.proofRequired,
                isCustom: h.isCustom,
                pointValue: h.pointValue,
              } as Habit
            }
            streak={h.current}
            completed={h.doneToday || busyId === h._id}
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
