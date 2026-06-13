import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading, Label, Title } from '@/components/ui/text';
import type { LedgerEntry } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

/** Relative time — "just now", "2h", "3d". */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return `${Math.floor(day / 7)}w ago`;
}

/** "complete:Run" / "redeem:Coffee" → a readable label. */
function prettySource(source: string): string {
  const [kind, ...rest] = source.split(':');
  const name = rest.join(':');
  if (kind === 'complete') return name || 'Habit complete';
  if (kind === 'redeem') return name ? `Redeemed ${name}` : 'Redeemed reward';
  return name || source;
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const isEarn = entry.type === 'earn';
  return (
    <View className="flex-row items-center gap-3 border-b border-border py-3.5">
      <View
        className="h-9 w-9 items-center justify-center rounded-pill"
        style={{ backgroundColor: isEarn ? 'rgba(139,92,246,0.15)' : '#1C1C2A' }}>
        <Feather
          name={isEarn ? 'arrow-up-right' : 'arrow-down-left'}
          size={16}
          color={isEarn ? '#C4B5FD' : '#6E6E85'}
        />
      </View>
      <View className="flex-1">
        <Label className="text-text-primary" numberOfLines={1}>
          {prettySource(entry.source)}
        </Label>
        <Caption className="mt-0.5">
          {timeAgo(entry.createdAt)} · balance {entry.balanceAfter}
        </Caption>
      </View>
      <Label
        className="font-sans-semibold"
        style={{ color: isEarn ? '#A78BFA' : '#6E6E85' }}>
        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
      </Label>
    </View>
  );
}

export default function LedgerScreen() {
  const ledger = useAppStore((s) => s.ledger);
  const availablePoints = useAppStore((s) => s.availablePoints);
  const lifetimeEarned = useAppStore((s) => s.lifetimeEarned);

  const entries = [...ledger].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Screen scroll>
      {/* Header */}
      <View className="mb-1 mt-2 flex-row items-center justify-between">
        <Title>Points history</Title>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={() => router.back()}>
          <Feather name="x" size={24} color="#B9B9CC" />
        </Pressable>
      </View>

      {/* Balance summary */}
      <Card className="mt-4 px-5 py-5">
        <Caption>Available</Caption>
        <Display className="mt-1 text-violet-300">{availablePoints}</Display>
        <View className="mt-3 flex-row items-center gap-1.5">
          <Feather name="trending-up" size={13} color="#6E6E85" />
          <Caption>{lifetimeEarned} earned all-time</Caption>
        </View>
      </Card>

      {/* Entries */}
      {entries.length === 0 ? (
        <View className="mt-12 items-center px-6">
          <View
            className="h-14 w-14 items-center justify-center rounded-pill border border-border"
            style={{ backgroundColor: '#14141F' }}>
            <Feather name="inbox" size={22} color="#6E6E85" />
          </View>
          <Heading className="mt-4 text-center">No points yet</Heading>
          <Body className="mt-1 text-center text-text-secondary">
            Prove a habit and your first points land here.
          </Body>
        </View>
      ) : (
        <View className="mt-7">
          <Heading className="mb-1">Activity</Heading>
          <Caption className="mb-2">Every point, earned and spent.</Caption>
          {entries.map((e) => (
            <LedgerRow key={e.id} entry={e} />
          ))}
        </View>
      )}
    </Screen>
  );
}
