import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Heading, Label } from '@/components/ui/text';
import { hapticSuccess, hapticTap, hapticWarn } from '@/lib/haptics';
import { useAppStore } from '@/store/useAppStore';

export default function JoinCircleScreen() {
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(false);

  const close = () => {
    hapticTap();
    router.back();
  };

  const handleJoin = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError(true);
      hapticWarn();
      return;
    }
    if (useAppStore.getState().joinByCode(trimmed)) {
      hapticSuccess();
      router.replace('/(tabs)/circle');
    } else {
      setError(true);
      hapticWarn();
    }
  };

  return (
    <Screen scroll>
      <View className="mb-6 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Heading className="font-display text-[28px] leading-[34px]">Join a Circle</Heading>
          <Body className="mt-1 text-text-secondary">
            Got a code from a friend? Drop it in below.
          </Body>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={close}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-1">
          <Feather name="x" size={20} color="#C9C5D6" />
        </Pressable>
      </View>

      <Label className="mb-3 text-center text-text-secondary">Enter your invite code</Label>
      <TextInput
        value={code}
        onChangeText={(t) => {
          setCode(t.toUpperCase());
          if (error) setError(false);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="ABC123"
        placeholderTextColor="#5A5670"
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={handleJoin}
        maxLength={8}
        className={`h-16 rounded-lg border bg-surface-2 px-4 text-center font-display text-[28px] tracking-[8px] text-text-primary ${
          error ? 'border-danger' : focused ? 'border-violet-500' : 'border-transparent'
        }`}
      />

      {error ? (
        <Caption className="mt-3 text-center text-danger">
          That code didn&apos;t work. Double-check it and try again.
        </Caption>
      ) : (
        <Caption className="mt-3 text-center">
          Your code is 6 characters — no spaces.
        </Caption>
      )}

      <View className="mt-10">
        <Button label="Join" icon="arrow-right" onPress={handleJoin} />
      </View>
    </Screen>
  );
}
