import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading, Label, Title } from '@/components/ui/text';
import { BADGE_CATALOG } from '@/data/badges';
import { hapticTap } from '@/lib/haptics';
import type { Badge } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

const AVATAR_PRESETS: { color: string; label: string }[] = [
  { color: '#8B5CF6', label: 'Violet' },
  { color: '#2DD4BF', label: 'Teal' },
  { color: '#F59E0B', label: 'Amber' },
  { color: '#FB7185', label: 'Rose' },
  { color: '#34D399', label: 'Green' },
];

function StatCard({
  value,
  label,
  icon,
  tint,
}: {
  value: string;
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  tint?: string;
}) {
  return (
    <Card className="flex-1 items-center px-2 py-4">
      {icon ? (
        <Ionicons name={icon} size={18} color={tint ?? '#C4B5FD'} style={{ marginBottom: 4 }} />
      ) : null}
      <Display className="text-[28px] leading-[32px]" style={tint ? { color: tint } : undefined}>
        {value}
      </Display>
      <Caption className="mt-1 text-center">{label}</Caption>
    </Card>
  );
}

function BadgeSlot({ badge, earned }: { badge: Badge; earned: boolean }) {
  const hint =
    badge.kind === 'streak'
      ? `${badge.threshold}-day`
      : `${badge.threshold} proof${badge.threshold > 1 ? 's' : ''}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${badge.name}, ${earned ? 'earned' : 'locked'}`}
      onPress={() => {
        hapticTap();
        Alert.alert(
          badge.name,
          `${badge.blurb}\n\n${earned ? 'Earned.' : `Locked — reach ${hint}.`}`,
        );
      }}
      className="mb-4 w-[30%] items-center">
      <View
        className="h-16 w-16 items-center justify-center rounded-pill border"
        style={{
          borderColor: earned ? '#8B5CF6' : '#2E2E40',
          backgroundColor: earned ? 'rgba(139,92,246,0.15)' : '#14141F',
          borderStyle: earned ? 'solid' : 'dashed',
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
        <Feather name={badge.icon} size={24} color={earned ? '#C4B5FD' : '#6E6E85'} />
      </View>
      <Caption
        className="mt-1.5 text-center"
        style={earned ? { color: '#C4B5FD' } : undefined}
        numberOfLines={1}>
        {earned ? badge.name.split(' ')[0] : hint}
      </Caption>
    </Pressable>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        hapticTap();
        onPress();
      }}
      className="flex-row items-center gap-3 border-b border-border py-4">
      <Feather name={icon} size={18} color={danger ? '#6E6E85' : '#C4B5FD'} />
      <Body className={danger ? 'flex-1 text-text-muted' : 'flex-1 text-text-primary'}>{label}</Body>
      <Feather name="chevron-right" size={18} color="#6E6E85" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const user = useAppStore((s) => s.user);
  const streaks = useAppStore((s) => s.streaks);
  const completions = useAppStore((s) => s.completions);
  const earnedBadges = useAppStore((s) => s.earnedBadges);
  const setAvatarColor = useAppStore((s) => s.setAvatarColor);
  const reset = useAppStore((s) => s.reset);

  const [editing, setEditing] = useState(false);

  const streakValues = Object.values(streaks);
  const bestCurrent = streakValues.reduce((m, s) => Math.max(m, s.current), 0);
  const longest = streakValues.reduce((m, s) => Math.max(m, s.longest), 0);

  const earned = earnedBadges();
  const earnedIds = new Set(earned.map((b) => b.id));

  const handleReset = () => {
    Alert.alert(
      'Reset everything?',
      'This clears your habits, streaks, and points — handy for re-testing onboarding.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => reset() },
      ],
    );
  };

  return (
    <Screen scroll>
      {/* Identity */}
      <View className="mt-4 items-center">
        <View
          className="rounded-pill"
          style={{
            shadowColor: user.avatarColor,
            shadowOpacity: 0.35,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 0 },
            elevation: 10,
          }}>
          <View
            className="h-24 w-24 items-center justify-center rounded-pill border-2"
            style={{
              borderColor: user.avatarColor,
              backgroundColor: `${user.avatarColor}26`,
            }}>
            <Heading className="text-[28px] leading-[34px]" style={{ color: user.avatarColor }}>
              {user.avatarInitials}
            </Heading>
          </View>
        </View>
        <Title className="mt-4">{user.name || 'You'}</Title>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit avatar"
          onPress={() => {
            hapticTap();
            setEditing((v) => !v);
          }}
          className="mt-2 flex-row items-center gap-1.5">
          <Feather name="edit-2" size={13} color="#C4B5FD" />
          <Label className="text-violet-300">Edit avatar</Label>
        </Pressable>

        {editing ? (
          <View className="mt-4 flex-row flex-wrap items-center justify-center gap-3">
            {AVATAR_PRESETS.map((p) => {
              const selected = p.color.toLowerCase() === user.avatarColor.toLowerCase();
              return (
                <Pressable
                  key={p.color}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.label} avatar`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    hapticTap();
                    setAvatarColor(p.color);
                  }}
                  className="h-10 w-10 items-center justify-center rounded-pill border-2"
                  style={{
                    borderColor: selected ? '#F5F4FB' : 'transparent',
                    backgroundColor: p.color,
                  }}>
                  {selected ? <Feather name="check" size={16} color="#0E0E16" /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Stats */}
      <View className="mt-8 flex-row gap-3">
        <StatCard value={String(bestCurrent)} label="Current streak" icon="flame" tint="#FB923C" />
        <StatCard value={String(longest)} label="Longest" />
        <StatCard value={String(completions.length)} label="Total proofs" />
      </View>

      {/* Badge shelf */}
      <Heading className="mb-1 mt-8">Trophy case</Heading>
      <Caption className="mb-4">
        {earned.length > 0
          ? `${earned.length} of ${BADGE_CATALOG.length} earned. The shelf keeps growing.`
          : 'Your first badge is one proof away.'}
      </Caption>
      <Card className="px-4 pb-0 pt-4">
        <View className="flex-row flex-wrap justify-between">
          {BADGE_CATALOG.map((b) => (
            <BadgeSlot key={b.id} badge={b} earned={earnedIds.has(b.id)} />
          ))}
        </View>
      </Card>

      {/* Links */}
      <Heading className="mb-1 mt-8">More</Heading>
      <View className="mt-1">
        <LinkRow icon="trending-up" label="Your progress" onPress={() => router.push('/progress')} />
        <LinkRow icon="list" label="Points history" onPress={() => router.push('/ledger')} />
        <LinkRow
          icon="bell"
          label="Notifications"
          onPress={() => router.push('/settings/notifications')}
        />
        <LinkRow icon="refresh-ccw" label="Reset (dev)" onPress={handleReset} danger />
      </View>
    </Screen>
  );
}
