import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Body, Caption, Label } from '@/components/ui/text';
import { springPop } from '@/lib/motion';
import type { Reward } from '@/lib/types';

type RewardCardProps = {
  reward: Reward;
  availablePoints: number;
  justRedeemed?: boolean;
  onRedeem: (id: string) => void;
};

/**
 * A single marketplace reward (DESIGN-SPEC §3 — redemption is presented as an
 * event, not a form submit). Affordable rewards show a Redeem button; once
 * redeemed the card flips into an in-place "Redeemed!" success state with a
 * soft spring. Sold-out and points-to-go states keep the shelf encouraging.
 */
export function RewardCard({ reward, availablePoints, justRedeemed, onRedeem }: RewardCardProps) {
  const reducedMotion = useReducedMotion();
  const soldOut = reward.stock <= 0;
  const affordable = availablePoints >= reward.cost;
  const toGo = reward.cost - availablePoints;
  const isCause = reward.type === 'cause';

  // Success flip-in when this card was the most recent redemption.
  const success = useSharedValue(justRedeemed ? 1 : 0);
  const successScale = useSharedValue(reducedMotion ? 1 : 0.85);

  useEffect(() => {
    if (justRedeemed) {
      success.value = withTiming(1, { duration: 200 });
      successScale.value = reducedMotion ? 1 : withSpring(1, springPop);
    } else {
      success.value = withTiming(0, { duration: 160 });
      successScale.value = reducedMotion ? 1 : 0.85;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justRedeemed]);

  const successStyle = useAnimatedStyle(() => ({
    opacity: success.value,
    transform: [{ scale: successScale.value }],
  }));

  return (
    <Card className="mb-3 overflow-hidden p-4">
      <View className="flex-row items-center">
        {/* Icon tile */}
        <View className="h-14 w-14 items-center justify-center rounded-md border border-border bg-surface-2">
          <Feather name={reward.icon} size={22} color={isCause ? '#34D399' : '#C4B5FD'} />
        </View>

        {/* Title + blurb */}
        <View className="ml-4 flex-1">
          <View className="flex-row items-center gap-2">
            <Label className="text-text-primary">{reward.title}</Label>
            {isCause ? (
              <View className="rounded-pill border border-success/40 bg-success/10 px-2 py-0.5">
                <Caption className="text-success">Donation</Caption>
              </View>
            ) : null}
          </View>
          {reward.blurb ? (
            <Caption className="mt-1 text-text-secondary">{reward.blurb}</Caption>
          ) : null}

          {/* Cost pill */}
          <View className="mt-2 flex-row">
            <View className="flex-row items-center gap-1 rounded-pill bg-surface-2 px-2.5 py-1">
              <Feather name="zap" size={12} color="#C4B5FD" />
              <Caption className="text-violet-300">{reward.cost}</Caption>
            </View>
          </View>
        </View>
      </View>

      {/* Action / state row */}
      <View className="mt-4">
        {soldOut ? (
          <View className="h-9 items-center justify-center rounded-md border border-border bg-surface-2/60">
            <Label className="text-text-muted">Sold out</Label>
          </View>
        ) : affordable ? (
          <Button
            label="Redeem"
            icon="gift"
            onPress={() => onRedeem(reward.id)}
            accessibilityLabel={`Redeem ${reward.title} for ${reward.cost} points`}
          />
        ) : (
          <View className="h-9 flex-row items-center justify-center gap-1.5 rounded-md border border-border bg-surface-2/40">
            <Feather name="lock" size={13} color="#6F6F87" />
            <Caption className="text-text-secondary">{toGo} points to go</Caption>
          </View>
        )}
      </View>

      {/* In-place celebratory success overlay (DESIGN-SPEC §3). */}
      {justRedeemed ? (
        <Animated.View
          pointerEvents="none"
          style={successStyle}
          className="absolute inset-0 items-center justify-center gap-2 rounded-lg border border-success/40 bg-bg/95">
          <View className="h-12 w-12 items-center justify-center rounded-pill bg-success/15">
            <Feather name="check" size={26} color="#34D399" />
          </View>
          <Body className="font-sans-semibold text-success">Redeemed!</Body>
          <Caption className="text-text-secondary">
            {isCause ? 'Thank you — it counts.' : "It's yours. You earned this."}
          </Caption>
        </Animated.View>
      ) : null}
    </Card>
  );
}
