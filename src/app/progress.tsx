import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading, Label, Title } from '@/components/ui/text';
import { useAppStore } from '@/store/useAppStore';

const DAYS = 14;

/** Local YYYY-MM-DD for a Date. */
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="flex-1 px-4 py-4">
      <Display className="text-[26px] leading-[30px] text-violet-300">{value}</Display>
      <Caption className="mt-1">{label}</Caption>
    </Card>
  );
}

export default function ProgressScreen() {
  const completions = useAppStore((s) => s.completions);
  const streaks = useAppStore((s) => s.streaks);
  const habits = useAppStore((s) => s.habits);
  const lifetimeEarned = useAppStore((s) => s.lifetimeEarned);

  // Per-day counts.
  const byDate = new Map<string, number>();
  for (const c of completions) byDate.set(c.localDate, (byDate.get(c.localDate) ?? 0) + 1);

  // Last 14 days, oldest → newest.
  const days: { iso: string; count: number; weekday: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = toISO(d);
    days.push({ iso, count: byDate.get(iso) ?? 0, weekday: d.getDay() });
  }

  const longest = Object.values(streaks).reduce((m, s) => Math.max(m, s.longest), 0);
  const daysActive = byDate.size;
  const totalProofs = completions.length;

  // Top habit by completion count.
  const habitCounts = new Map<string, number>();
  for (const c of completions) habitCounts.set(c.habitId, (habitCounts.get(c.habitId) ?? 0) + 1);
  let topHabitId: string | null = null;
  let topCount = 0;
  for (const [id, n] of habitCounts) {
    if (n > topCount) {
      topCount = n;
      topHabitId = id;
    }
  }
  const topHabit = habits.find((h) => h.id === topHabitId);

  const isEarly = totalProofs === 0;
  const highlight = isEarly
    ? 'Your story starts today.'
    : topHabit
      ? `${daysActive} ${daysActive === 1 ? 'day' : 'days'} of ${topHabit.name.toLowerCase()}.`
      : `${daysActive} ${daysActive === 1 ? 'day' : 'days'} of building.`;

  return (
    <Screen scroll>
      {/* Header */}
      <View className="mb-1 mt-2 flex-row items-center justify-between">
        <Title>Your progress</Title>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={() => router.back()}>
          <Feather name="x" size={24} color="#B9B9CC" />
        </Pressable>
      </View>
      <Body className="mb-7 text-text-secondary">
        You&rsquo;ve come this far. Here&rsquo;s the shape of it.
      </Body>

      {/* Highlight line */}
      <Display className="text-[30px] leading-[36px] text-text-primary">{highlight}</Display>
      {!isEarly ? (
        <Caption className="mt-2">The proof is in the days you showed up.</Caption>
      ) : null}

      {/* Activity row */}
      <Heading className="mb-1 mt-8">Last 14 days</Heading>
      <Caption className="mb-4">Each filled dot is a day you proved something.</Caption>
      <Card className="px-4 py-5">
        <View className="flex-row justify-between">
          {days.map((d) => {
            const active = d.count > 0;
            return (
              <View key={d.iso} className="items-center" style={{ width: `${100 / DAYS}%` }}>
                <View
                  className="rounded-pill"
                  style={{
                    width: 14,
                    height: 14,
                    backgroundColor: active ? '#8B5CF6' : '#1C1C2A',
                    borderWidth: active ? 0 : 1,
                    borderColor: '#2E2E40',
                    ...(active
                      ? {
                          shadowColor: '#A78BFA',
                          shadowOpacity: 0.5,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: 3,
                        }
                      : null),
                  }}
                />
                <Caption className="mt-2" style={{ fontSize: 9, lineHeight: 12 }}>
                  {WEEKDAY[d.weekday]}
                </Caption>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Totals */}
      <Heading className="mb-4 mt-8">The numbers</Heading>
      <View className="gap-3">
        <View className="flex-row gap-3">
          <StatTile value={String(totalProofs)} label="Total proofs" />
          <StatTile value={String(longest)} label="Longest streak" />
        </View>
        <View className="flex-row gap-3">
          <StatTile value={String(daysActive)} label="Days active" />
          <StatTile value={String(lifetimeEarned)} label="Points earned" />
        </View>
      </View>

      {/* Badges recap */}
      <BadgeRecap />
    </Screen>
  );
}

function BadgeRecap() {
  const earnedBadges = useAppStore((s) => s.earnedBadges);
  const earned = earnedBadges();

  if (earned.length === 0) {
    return (
      <>
        <Heading className="mb-1 mt-8">Badges</Heading>
        <Caption className="mb-2">None yet — your first one is close. Keep showing up.</Caption>
      </>
    );
  }

  return (
    <>
      <Heading className="mb-1 mt-8">Badges earned</Heading>
      <Caption className="mb-4">{earned.length} so far. Tap your trophy case for the rest.</Caption>
      <View className="gap-3">
        {earned.map((b) => (
          <Card key={b.id} className="flex-row items-center gap-3 px-4 py-3">
            <View
              className="h-11 w-11 items-center justify-center rounded-pill border border-violet-500"
              style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
              <Feather name={b.icon} size={18} color="#C4B5FD" />
            </View>
            <View className="flex-1">
              <Label className="text-text-primary">{b.name}</Label>
              <Caption className="mt-0.5">{b.blurb}</Caption>
            </View>
          </Card>
        ))}
      </View>
    </>
  );
}
