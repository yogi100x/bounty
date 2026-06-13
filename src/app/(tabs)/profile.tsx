import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Caption, Display, Heading, Label, Title } from '@/components/ui/text';

type Stat = { id: string; label: string; value: string };

const STATS: Stat[] = [
  { id: 'current', label: 'Current streak', value: '12' },
  { id: 'longest', label: 'Longest', value: '21' },
  { id: 'proofs', label: 'Total proofs', value: '148' },
];

type Badge = {
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  earned: boolean;
  next?: boolean;
};

const BADGES: Badge[] = [
  { id: 'first', icon: 'star', earned: true },
  { id: 'week', icon: 'zap', earned: true },
  { id: 'month', icon: 'award', earned: false, next: true },
  { id: 'hundred', icon: 'trending-up', earned: false },
  { id: 'lock', icon: 'lock', earned: false },
];

function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card className="flex-1 items-center px-2 py-4">
      <Display className="text-[28px] leading-[32px] text-violet-300">{stat.value}</Display>
      <Caption className="mt-1 text-center">{stat.label}</Caption>
    </Card>
  );
}

function BadgeSlot({ badge }: { badge: Badge }) {
  const earned = badge.earned;
  const next = badge.next;
  return (
    <View className="items-center">
      <View
        className="h-14 w-14 items-center justify-center rounded-pill border"
        style={{
          borderColor: earned ? '#8B5CF6' : next ? '#A78BFA' : '#2E2E40',
          backgroundColor: earned ? 'rgba(139,92,246,0.15)' : '#14141F',
          borderStyle: next && !earned ? 'dashed' : 'solid',
          ...(earned
            ? {
                shadowColor: '#A78BFA',
                shadowOpacity: 0.25,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 0 },
                elevation: 5,
              }
            : null),
        }}>
        <Feather
          name={badge.icon}
          size={22}
          color={earned ? '#C4B5FD' : next ? '#A78BFA' : '#6E6E85'}
        />
      </View>
      {next ? <Caption className="mt-1.5 text-violet-300">Next up</Caption> : null}
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <Screen scroll>
      <Title className="mb-2 mt-2">Profile</Title>

      {/* Identity */}
      <View className="mt-2 items-center">
        <View
          className="h-24 w-24 items-center justify-center rounded-pill border border-violet-500 bg-violet-500/15"
          style={{
            shadowColor: '#A78BFA',
            shadowOpacity: 0.25,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          }}>
          <Heading className="text-violet-300">YB</Heading>
        </View>
        <Heading className="mt-4">Yogi B.</Heading>
        <Caption className="mt-1">Showing up since June</Caption>
      </View>

      {/* Stats */}
      <View className="mt-8 flex-row gap-3">
        {STATS.map((s) => (
          <StatCard key={s.id} stat={s} />
        ))}
      </View>

      {/* Badge shelf */}
      <Heading className="mb-1 mt-8">Trophy case</Heading>
      <Caption className="mb-4">Your milestones live here.</Caption>
      <Card className="p-4">
        <View className="flex-row items-start justify-between">
          {BADGES.map((b) => (
            <BadgeSlot key={b.id} badge={b} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}
