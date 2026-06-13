import { useEffect, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { Button } from '@/components/ui/button';
import { Body, Caption, Heading, Label } from '@/components/ui/text';
import { useAppStore } from '@/store/useAppStore';
import { hapticTap } from '@/lib/haptics';

export default function CaptureScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const habit = useAppStore((s) => s.habits.find((h) => h.id === habitId));

  const [proofUri, setProofUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  // No matching habit (e.g. deep-link with stale id) — bail back to Today.
  useEffect(() => {
    if (!habit) router.back();
  }, [habit]);

  if (!habit) return null;

  const takePhoto = async () => {
    hapticTap();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Camera access needed',
        'Enable camera access in Settings to snap your proof, or choose from your library instead.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setProofUri(result.assets[0].uri);
  };

  const chooseFromLibrary = async () => {
    hapticTap();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photo access needed',
        'Enable photo access in Settings to pick your proof.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setProofUri(result.assets[0].uri);
  };

  const handleComplete = () => {
    if (!proofUri) return;
    useAppStore.getState().completeHabitToday(habitId, {
      proofUri,
      caption: caption.trim() || undefined,
    });
    router.replace('/award');
  };

  return (
    <Screen scroll>
      {/* Header: close + title */}
      <View className="mb-6 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Heading className="font-display text-[28px] leading-[34px]">Prove it</Heading>
          <Body className="mt-1 text-text-secondary">{habit.name}</Body>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={() => {
            hapticTap();
            router.back();
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-1">
          <Feather name="x" size={20} color="#C9C5D6" />
        </Pressable>
      </View>

      {proofUri ? (
        <>
          {/* Hero preview */}
          <View className="overflow-hidden rounded-lg border border-border bg-surface-1">
            <Image
              source={{ uri: proofUri }}
              style={{ width: '100%', aspectRatio: 1 }}
              contentFit="cover"
              transition={200}
            />
          </View>

          <View className="mb-6 mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Feather name="users" size={13} color="#8C879B" />
              <Caption>Shared with your Circle</Caption>
            </View>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                hapticTap();
                setProofUri(null);
              }}
              className="flex-row items-center gap-1.5">
              <Feather name="rotate-ccw" size={14} color="#C4B5FD" />
              <Label className="text-violet-300">Retake</Label>
            </Pressable>
          </View>

          {/* Caption */}
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a note (optional)"
            placeholderTextColor="#8C879B"
            multiline
            className="min-h-[88px] rounded-lg bg-surface-2 px-4 py-3 font-sans text-[16px] leading-[24px] text-text-primary"
            textAlignVertical="top"
          />
        </>
      ) : (
        <>
          {/* Empty hero placeholder */}
          <View className="aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-surface-1">
            <Feather name="camera" size={40} color="#8C879B" />
            <Body className="mt-3 text-text-secondary">Add a photo to prove it</Body>
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <Feather name="users" size={12} color="#8C879B" />
              <Caption>Shared with your Circle</Caption>
            </View>
          </View>

          <View className="mt-6 gap-3">
            <Button icon="camera" label="Take photo" onPress={takePhoto} />
            <Button
              variant="secondary"
              icon="image"
              label="Choose from library"
              onPress={chooseFromLibrary}
            />
          </View>
        </>
      )}

      {/* Submit */}
      <View className="mt-8">
        <Button label="Complete" icon="check" disabled={!proofUri} onPress={handleComplete} />
      </View>
    </Screen>
  );
}
