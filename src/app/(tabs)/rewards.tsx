import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { RewardCard } from '@/components/reward-card';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading, Label } from '@/components/ui/text';
import { hapticSuccess, hapticWarn } from '@/lib/haptics';
import type { Reward } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

export default function RewardsScreen() {
  const availablePoints = useAppStore((s) => s.availablePoints);
  const rewards = useAppStore((s) => s.rewards);

  const [justRedeemedId, setJustRedeemedId] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Causes first and cheapest-first, so the first redemption feels reachable;
  // brand rewards follow, also ascending — the shelf reads as a climb.
  const ordered = useMemo(() => {
    const rank = (r: Reward) => (r.type === 'cause' ? 0 : 1);
    return [...rewards].sort((a, b) => rank(a) - rank(b) || a.cost - b.cost);
  }, [rewards]);

  const nearest = useMemo(
    () =>
      ordered
        .filter((r) => r.stock > 0 && r.cost > availablePoints)
        .sort((a, b) => a.cost - b.cost)[0],
    [ordered, availablePoints],
  );

  const handleRedeem = (id: string) => {
    const res = useAppStore.getState().redeemReward(id);
    if (res.ok) {
      hapticSuccess();
      if (resetTimer.current) clearTimeout(resetTimer.current);
      setJustRedeemedId(id);
      resetTimer.current = setTimeout(() => setJustRedeemedId(null), 2400);
    } else {
      // Affordability is gated in the card, so a failure here is a race
      // (stock/points changed) — a gentle warn keeps it non-punishing.
      hapticWarn();
    }
  };

  return (
    <Screen scroll>
      {/* Hero — the balance as the prize. */}
      <View className="mt-2 items-center pb-2 pt-5">
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-pill bg-violet-500/15">
          <Feather name="zap" size={26} color="#C4B5FD" />
        </View>
        <Display className="text-[56px] leading-[60px] text-violet-300">{availablePoints}</Display>
        <Label className="mt-1 text-text-secondary">points to spend</Label>
        <Body className="mt-3 max-w-[280px] text-center text-text-secondary">
          {nearest
            ? `${nearest.cost - availablePoints} more and "${nearest.title}" is yours.`
            : 'Every one of these is within reach. Treat yourself.'}
        </Body>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/rewards/history')}
          className="mt-4 flex-row items-center gap-1.5 rounded-pill border border-border bg-surface-1 px-4 py-2">
          <Feather name="clock" size={14} color="#B9B9CC" />
          <Label className="text-text-secondary">History</Label>
        </Pressable>
      </View>

      {/* Catalog */}
      <Heading className="mb-1 mt-6">Marketplace</Heading>
      <Caption className="mb-4 text-text-secondary">
        Donations turn your streak into something bigger. Start there.
      </Caption>

      {ordered.map((reward) => (
        <RewardCard
          key={reward.id}
          reward={reward}
          availablePoints={availablePoints}
          justRedeemed={justRedeemedId === reward.id}
          onRedeem={handleRedeem}
        />
      ))}
    </Screen>
  );
}
