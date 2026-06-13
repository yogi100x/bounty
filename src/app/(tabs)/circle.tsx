import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { FeedCard } from '@/components/feed-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Heading, Label, Title } from '@/components/ui/text';
import { useCircle, useCircleActions } from '@/data/social';
import type { FeedEvent, Member } from '@/data/social';

const MAX_MEMBERS = 6;

export default function CircleScreen() {
  const data = useCircle();
  const actions = useCircleActions();

  if (data === undefined) {
    return <LoadingCircle />;
  }

  if (data === null) {
    return <EmptyCircle />;
  }

  const { circle, members, feed } = data;

  const confirmLeave = () => {
    Alert.alert(
      `Leave ${circle.name}?`,
      "You can always rejoin with an invite code. Your friends will miss you.",
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => void actions.leave(circle._id) },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <CircleHeader
            name={circle.name}
            memberCount={circle.memberCount}
            members={members}
            onLeave={confirmLeave}
          />
        }
        ListEmptyComponent={<FreshFeed />}
        renderItem={({ item }: { item: FeedEvent }) => (
          <FeedCard event={item} onCheer={(id) => void actions.cheer(id as FeedEvent['id'])} />
        )}
      />
    </SafeAreaView>
  );
}

// Minimal loading state while the circle query resolves.
function LoadingCircle() {
  return (
    <Screen>
      <Title className="mb-2 mt-2">Circle</Title>
      <View className="flex-1 items-center justify-center pb-16">
        <ActivityIndicator color="#A78BFA" />
      </View>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function CircleHeader({
  name,
  memberCount,
  members,
  onLeave,
}: {
  name: string;
  memberCount: number;
  members: Member[];
  onLeave: () => void;
}) {
  const shown = members.slice(0, 5);
  return (
    <View className="mb-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Title className="mt-1">{name}</Title>
          <Caption className="mt-1 text-text-secondary">
            {memberCount} of {MAX_MEMBERS} here
          </Caption>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Circle options"
          hitSlop={10}
          onPress={onLeave}
          className="h-9 w-9 items-center justify-center rounded-pill border border-border bg-surface-1">
          <Feather name="more-horizontal" size={18} color="#B9B9CC" />
        </Pressable>
      </View>

      {/* Member avatar row */}
      <View className="mt-4 flex-row items-center">
        {shown.map((m, i) => (
          <View key={m.userId} style={{ marginLeft: i === 0 ? 0 : -10 }}>
            <Avatar
              initials={m.initials}
              size={40}
              highlight={m.isMe}
              className="border-2 border-bg"
            />
          </View>
        ))}
        {members.length > shown.length ? (
          <View
            style={{ marginLeft: -10 }}
            className="h-10 w-10 items-center justify-center rounded-pill border-2 border-bg bg-surface-2">
            <Caption className="text-text-secondary">+{members.length - shown.length}</Caption>
          </View>
        ) : null}
      </View>

      {/* Self prompt — keep your own streak going */}
      <Card className="mt-5 flex-row items-center gap-3 bg-surface-1 p-4">
        <View
          className="h-10 w-10 items-center justify-center rounded-pill bg-violet-500/15"
          style={{
            shadowColor: '#A78BFA',
            shadowOpacity: 0.25,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 0 },
          }}>
          <Ionicons name="flame" size={20} color="#FB923C" />
        </View>
        <View className="flex-1">
          <Label className="font-sans-semibold text-text-primary">Keep your streak alive</Label>
          <Caption className="mt-0.5 text-text-secondary">
            Show up today and your Circle sees it.
          </Caption>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to today"
          hitSlop={8}
          onPress={() => router.push('/(tabs)')}>
          <Feather name="chevron-right" size={20} color="#6E6E85" />
        </Pressable>
      </Card>
    </View>
  );
}

// A circle with members but no feed events yet — anticipation, not void.
function FreshFeed() {
  return (
    <View className="items-center pt-12">
      <View
        className="h-16 w-16 items-center justify-center rounded-pill bg-violet-500/15"
        style={{
          shadowColor: '#A78BFA',
          shadowOpacity: 0.2,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 0 },
        }}>
        <Feather name="sunrise" size={28} color="#C4B5FD" />
      </View>
      <Heading className="mt-5 text-center">The first proof lands here</Heading>
      <Body className="mt-2 max-w-[280px] text-center text-text-secondary">
        Complete a habit today and your Circle will be the first to cheer you on.
      </Body>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function EmptyCircle() {
  return (
    <Screen>
      <Title className="mb-2 mt-2">Circle</Title>

      <View className="flex-1 items-center justify-center pb-16">
        <View
          className="h-24 w-24 items-center justify-center rounded-pill border border-border bg-surface-1"
          style={{
            shadowColor: '#A78BFA',
            shadowOpacity: 0.25,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          }}>
          <Feather name="users" size={36} color="#C4B5FD" />
        </View>

        <Heading className="mt-7 text-center">Habits stick better together</Heading>
        <Body className="mt-3 max-w-[300px] text-center text-text-secondary">
          Start a private Circle and bring a friend in. You will cheer each other on and show up on
          the days it is hard.
        </Body>

        <View className="mt-8 w-full max-w-[320px] gap-3">
          <Button
            label="Create a Circle"
            icon="plus-circle"
            onPress={() => router.push('/circle/create')}
          />
          <Button
            variant="ghost"
            label="Join with a code"
            icon="hash"
            onPress={() => router.push('/circle/join')}
          />
        </View>
      </View>
    </Screen>
  );
}
