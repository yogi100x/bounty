import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Confetti } from '@/components/confetti';
import { Button } from '@/components/ui/button';
import { Body, Caption, Display, Label, Title } from '@/components/ui/text';
import { hapticMilestone, hapticSuccess } from '@/lib/haptics';
import { durations, springPop } from '@/lib/motion';
import { useAppStore } from '@/store/useAppStore';

export default function AwardScreen() {
  const award = useAppStore((s) => s.lastAward);
  const clearAward = useAppStore((s) => s.clearAward);
  const reducedMotion = useReducedMotion();

  const close = () => {
    clearAward();
    router.back();
  };

  // ── Guard: nothing to celebrate (null) or a repeat tap today. ──────────────
  if (!award || award.alreadyDone) {
    return (
      <SafeAreaView className="flex-1 bg-bg/95">
        <View className="flex-1 items-center justify-center gap-6 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-pill bg-surface-2">
            <Feather name="check" size={30} color="#34D399" />
          </View>
          <Title className="text-center">Already done today</Title>
          <Body className="text-center text-text-secondary">
            You&apos;ve already logged this one. Come back tomorrow to keep it going.
          </Body>
          <View className="w-full pt-2">
            <Button label="Close" variant="secondary" onPress={close} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return <AwardCelebration award={award} reducedMotion={reducedMotion} onClose={close} />;
}

type AwardResult = NonNullable<ReturnType<typeof useAppStore.getState>['lastAward']>;

function AwardCelebration({
  award,
  reducedMotion,
  onClose,
}: {
  award: AwardResult;
  reducedMotion: boolean;
  onClose: () => void;
}) {
  // Count-up driver (0 → pointsEarned over ~700ms), mirrored to React state.
  const counter = useSharedValue(0);
  const [displayPoints, setDisplayPoints] = useState(reducedMotion ? award.pointsEarned : 0);

  // Entrance + element animations.
  const scrim = useSharedValue(0);
  const cardScale = useSharedValue(reducedMotion ? 1 : 0.9);
  const streakScale = useSharedValue(reducedMotion ? 1 : 0);
  const glow = useSharedValue(0);

  useEffect(() => {
    // 1. Haptic on the same frame the moment begins.
    if (award.isMilestone) hapticMilestone();
    else hapticSuccess();

    // Scrim fades in (screen duration).
    scrim.value = withTiming(1, { duration: durations.screen });

    if (reducedMotion) {
      setDisplayPoints(award.pointsEarned);
    } else {
      // Card springs/scales in.
      cardScale.value = withSpring(1, springPop);
      // 2. Points count-up.
      counter.value = withTiming(award.pointsEarned, { duration: 700 });
      // 3. Streak pops in slightly after the number starts climbing.
      streakScale.value = withDelay(220, withSpring(1, springPop));
    }

    // Soft ambient glow pulse behind the streak.
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0.4, { duration: 1400 })), -1, true);

    return () => {
      cancelAnimation(counter);
      cancelAnimation(glow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror the shared counter into rendered integer state.
  useAnimatedReaction(
    () => Math.round(counter.value),
    (current, prev) => {
      if (current !== prev) runOnJS(setDisplayPoints)(current);
    },
  );

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: scrim.value,
    transform: [{ scale: cardScale.value }],
  }));
  const streakStyle = useAnimatedStyle(() => ({
    opacity: streakScale.value,
    transform: [{ scale: streakScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.18 + glow.value * 0.22 }));

  const headline = award.isMilestone ? `${award.newStreak}-day streak!` : 'You did it.';

  return (
    <Animated.View style={scrimStyle} className="flex-1 bg-bg/95">
      <SafeAreaView className="flex-1">
        <Animated.View style={cardStyle} className="flex-1 items-center justify-center gap-7 px-8">
          {/* Confetti burst anchored at center, behind the number. */}
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <Confetti milestone={award.isMilestone} reducedMotion={reducedMotion} />
          </View>

          {/* Hero: the points count-up. */}
          <View className="items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-pill bg-violet-500/20">
              <Feather name="zap" size={26} color="#C4B5FD" />
            </View>
            <View className="flex-row items-baseline">
              <Display className="text-[64px] leading-[64px] text-violet-300">+</Display>
              <Display className="text-[64px] leading-[64px] text-text-primary">{displayPoints}</Display>
            </View>
            <Label className="text-text-secondary">points earned</Label>
          </View>

          {/* Streak tick with a soft glow. */}
          <Animated.View style={streakStyle} className="items-center">
            <View className="items-center justify-center">
              <Animated.View
                style={glowStyle}
                pointerEvents="none"
                className="absolute h-20 w-20 rounded-pill bg-streak"
              />
              <View className="flex-row items-center gap-2 px-2">
                <Feather name="zap" size={28} color="#FB923C" />
                <Display className="text-[44px] leading-[48px] text-streak">{award.newStreak}</Display>
              </View>
            </View>
            <Label className="mt-1 text-text-secondary">day streak</Label>
          </Animated.View>

          {/* Earned copy. */}
          <View className="items-center gap-2">
            <Title className="text-center">{headline}</Title>
            <Body className="text-center text-text-secondary">
              {award.newStreak} {award.newStreak === 1 ? 'day' : 'days'} of {award.habitName}
            </Body>
            {award.isMilestone ? (
              <Caption className="text-center text-violet-300">+{award.milestoneBonus} milestone bonus</Caption>
            ) : null}
          </View>

          {/* Primary action — back to Today. */}
          <View className="w-full pt-2">
            <Button label="Keep going" icon="arrow-right" onPress={onClose} />
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}
