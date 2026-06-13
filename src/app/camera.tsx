import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Body, Caption, Heading, Label, Title } from '@/components/ui/text';
import { useCoreActions, useSnapshot } from '@/data/core';
import { hapticSuccess, hapticTap } from '@/lib/haptics';

type Facing = 'back' | 'front';

/** Round, translucent control used for close/flip — sits over the live camera. */
function GlassControl({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full"
      style={{ backgroundColor: 'rgba(10,8,18,0.55)' }}>
      <Feather name={icon} size={20} color="#F5F4FB" />
    </Pressable>
  );
}

export default function CameraScreen() {
  const params = useLocalSearchParams<{ habitId?: string }>();
  const snap = useSnapshot();
  const actions = useCoreActions();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<Facing>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Resolve the target habit: explicit param wins, else the first due habit
  // that still needs proving today.
  const dueIds = new Set(snap?.dueHabitIds ?? []);
  const targetHabit =
    snap?.habits.find((h) =>
      params.habitId ? h._id === params.habitId : dueIds.has(h._id) && !h.doneToday,
    ) ?? null;

  const close = () => {
    hapticTap();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  // ── Loading the snapshot ────────────────────────────────────────────────
  if (snap === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#C4B5FD" />
      </View>
    );
  }

  // ── Nothing to capture — calm "all caught up" ───────────────────────────
  if (!targetHabit) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="mb-4 h-14 w-14 items-center justify-center rounded-pill"
            style={{ backgroundColor: 'rgba(52,211,153,0.12)' }}>
            <Feather name="check" size={28} color="#34D399" />
          </View>
          <Title className="text-center">All caught up</Title>
          <Body className="mt-2 text-center text-text-secondary">
            Nothing left to capture today. Come back tomorrow for your next prompt.
          </Body>
          <Button className="mt-7" label="Close" icon="x" onPress={close} fullWidth={false} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Permission not granted yet ──────────────────────────────────────────
  if (!permission || !permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="absolute right-5 top-3 z-10">
          <GlassControl icon="x" label="Close" onPress={close} />
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="mb-4 h-14 w-14 items-center justify-center rounded-pill"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
            <Feather name="camera" size={28} color="#C4B5FD" />
          </View>
          <Title className="text-center">Allow camera</Title>
          <Body className="mt-2 text-center text-text-secondary">
            Bounty captures your moment in the moment — no camera roll, no do-overs. We&rsquo;ll only
            use it when you press capture.
          </Body>
          <Button
            className="mt-7"
            label="Allow camera"
            icon="camera"
            onPress={() => {
              hapticTap();
              requestPermission();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const flip = () => {
    hapticTap();
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

  const capture = async () => {
    if (capturing || !cameraRef.current) return;
    hapticTap();
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) setPhotoUri(photo.uri);
    } finally {
      setCapturing(false);
    }
  };

  const usePhoto = async () => {
    if (!photoUri || submitting) return;
    setSubmitting(true);
    try {
      const award = await actions.completeHabit(targetHabit._id as Id<'habits'>, {
        proofUri: photoUri,
        source: 'bereal',
        onTime: true,
      });
      hapticSuccess();
      void award;
      router.replace('/award');
    } catch {
      setSubmitting(false);
    }
  };

  // ── Preview the captured photo ──────────────────────────────────────────
  if (photoUri) {
    return (
      <View className="flex-1 bg-black">
        <Image
          source={{ uri: photoUri }}
          style={{ flex: 1 }}
          contentFit="cover"
          transition={150}
        />
        <SafeAreaView className="absolute inset-0" pointerEvents="box-none">
          {/* Header */}
          <View className="px-5 pt-3">
            <Heading className="font-display text-[24px] text-white">{targetHabit.name}</Heading>
            <Caption className="mt-0.5 text-white/70">Looking good? Lock it in.</Caption>
          </View>

          {/* Bottom actions */}
          <View className="mt-auto px-5 pb-6">
            {submitting ? (
              <View
                className="flex-row items-center justify-center gap-2 rounded-pill py-4"
                style={{ backgroundColor: 'rgba(10,8,18,0.6)' }}>
                <ActivityIndicator color="#C4B5FD" />
                <Label className="text-white">Saving your proof…</Label>
              </View>
            ) : (
              <View className="gap-3">
                <Button label="Use photo" icon="check" onPress={usePhoto} />
                <Button
                  variant="secondary"
                  icon="rotate-ccw"
                  label="Retake"
                  onPress={() => {
                    hapticTap();
                    setPhotoUri(null);
                  }}
                />
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Live camera (the hero) ──────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} facing={facing} style={{ flex: 1 }} />

      <SafeAreaView className="absolute inset-0" pointerEvents="box-none">
        {/* Top bar: close + flip */}
        <View className="flex-row items-center justify-between px-5 pt-3">
          <GlassControl icon="x" label="Close" onPress={close} />
          <GlassControl icon="refresh-cw" label="Flip camera" onPress={flip} />
        </View>

        {/* Ritual framing line */}
        <View className="mt-auto items-center px-8 pb-5">
          <View
            className="mb-3 flex-row items-center gap-1.5 rounded-pill px-3 py-1"
            style={{ backgroundColor: 'rgba(139,92,246,0.22)' }}>
            <Feather name="zap" size={12} color="#C4B5FD" />
            <Caption className="text-violet-200">Daily prompt</Caption>
          </View>
          <Heading className="text-center font-display text-[26px] text-white">
            {targetHabit.name}
          </Heading>
          <Body className="mt-1 text-center text-white/80">Capture now — no filters, no redos.</Body>
        </View>

        {/* Shutter */}
        <View className="items-center pb-8">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture photo"
            onPress={capture}
            disabled={capturing}
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white">
              {capturing ? <ActivityIndicator color="#8B5CF6" /> : null}
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
