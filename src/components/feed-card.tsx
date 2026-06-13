import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { Body, Caption, Label } from '@/components/ui/text';
import { hapticTap } from '@/lib/haptics';
import { springPop } from '@/lib/motion';
import type { CircleEvent } from '@/lib/types';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

export type FeedCardProps = {
  event: CircleEvent;
  onCheer: (eventId: string) => void;
};

/** Relative time — "just now", "2h", "3d". */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return `${Math.floor(day / 7)}w`;
}

function StreakChip({ streak }: { streak: number }) {
  return (
    <View className="flex-row items-center gap-1 self-start rounded-pill border border-border bg-surface-2 px-2.5 py-1">
      <Ionicons name="flame" size={13} color="#FB923C" />
      <Label className="font-sans-semibold text-[12px] leading-[14px] text-streak">{streak}</Label>
    </View>
  );
}

function CheerButton({ event, onCheer }: FeedCardProps) {
  const scale = useSharedValue(1);

  const handle = () => {
    scale.value = withSpring(1.3, springPop, () => {
      scale.value = withSpring(1, springPop);
    });
    hapticTap();
    onCheer(event.id);
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: event.cheeredByMe }}
      accessibilityLabel={event.cheeredByMe ? 'Remove cheer' : 'Cheer'}
      hitSlop={10}
      onPress={handle}
      className="flex-row items-center gap-1.5">
      <AnimatedIonicons
        name={event.cheeredByMe ? 'heart' : 'heart-outline'}
        size={20}
        color={event.cheeredByMe ? '#A78BFA' : '#6E6E85'}
        style={animatedStyle}
      />
      {event.cheers > 0 ? (
        <Label
          className={
            event.cheeredByMe
              ? 'font-sans-medium text-violet-300'
              : 'font-sans-medium text-text-muted'
          }>
          {event.cheers}
        </Label>
      ) : null}
    </Pressable>
  );
}

/** A single Circle feed event: proof, milestone, or a quiet joined row. */
export function FeedCard({ event, onCheer }: FeedCardProps) {
  // Quiet "joined" row — no card, just a soft line.
  if (event.type === 'joined') {
    return (
      <View className="flex-row items-center gap-3 px-1 py-3">
        <Avatar initials={event.actorInitials} size={28} />
        <Caption className="flex-1 text-text-secondary">
          {event.actorName} joined the Circle
        </Caption>
        <Caption>{timeAgo(event.createdAt)}</Caption>
      </View>
    );
  }

  const isMilestone = event.type === 'milestone';

  return (
    <View
      className={
        isMilestone
          ? 'rounded-lg border border-violet-500/40 bg-violet-500/10 p-4'
          : 'rounded-lg border border-border bg-surface-1 p-4'
      }>
      {/* Header: avatar + name/action + time */}
      <View className="flex-row items-center gap-3">
        <Avatar initials={event.actorInitials} highlight={isMilestone} />
        <View className="flex-1">
          <View className="flex-row flex-wrap items-baseline">
            <Label className="font-sans-semibold text-text-primary">{event.actorName} </Label>
            {isMilestone ? (
              <Body className="text-streak">
                hit a {event.streak}-day streak!
              </Body>
            ) : (
              <Body className="text-text-secondary">
                completed <Body className="text-text-primary">{event.habitName}</Body>
              </Body>
            )}
          </View>
        </View>
        <Caption>{timeAgo(event.createdAt)}</Caption>
      </View>

      {/* Photo */}
      {event.photoUri ? (
        <Image
          source={{ uri: event.photoUri }}
          contentFit="cover"
          transition={200}
          style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, marginTop: 14 }}
        />
      ) : null}

      {/* Caption */}
      {event.caption ? (
        <Body className="mt-3 text-text-secondary">{event.caption}</Body>
      ) : null}

      {/* Footer: streak chip + cheer */}
      <View className="mt-3 flex-row items-center justify-between">
        {event.streak && !isMilestone ? <StreakChip streak={event.streak} /> : <View />}
        <CheerButton event={event} onCheer={onCheer} />
      </View>
    </View>
  );
}
