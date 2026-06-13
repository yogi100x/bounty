import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, Share, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading, Label } from '@/components/ui/text';
import { hapticSuccess, hapticTap } from '@/lib/haptics';
import { useAppStore } from '@/store/useAppStore';

type Visibility = 'private' | 'public';

export default function CreateCircleScreen() {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [focused, setFocused] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const close = () => {
    hapticTap();
    router.back();
  };

  const handleCreate = () => {
    const code = useAppStore.getState().createCircle(name.trim(), visibility);
    hapticSuccess();
    setInviteCode(code);
  };

  const shareInvite = async () => {
    if (!inviteCode) return;
    hapticTap();
    try {
      await Share.share({
        message: `Join my Bounty circle: ${Linking.createURL('invite/' + inviteCode)}`,
      });
    } catch {
      // user dismissed the share sheet — no-op
    }
  };

  // ── Success state: the shareable invite-code reveal ──────────────────────
  if (inviteCode) {
    return (
      <Screen scroll>
        <View className="mb-2 flex-row items-center justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            hitSlop={12}
            onPress={() => router.replace('/(tabs)/circle')}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-1">
            <Feather name="x" size={20} color="#C9C5D6" />
          </Pressable>
        </View>

        <View className="items-center pt-6">
          <View
            className="h-16 w-16 items-center justify-center rounded-pill bg-violet-500/20"
            style={{
              shadowColor: '#A78BFA',
              shadowOpacity: 0.25,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
              elevation: 6,
            }}>
            <Feather name="check" size={30} color="#C4B5FD" />
          </View>

          <Heading className="mt-6 text-center">Your Circle is live</Heading>
          <Body className="mt-2 max-w-[300px] text-center text-text-secondary">
            Share this code with a friend. The moment they join, you&apos;re in it together.
          </Body>

          {/* The hero: the invite code, big in Clash Display. */}
          <View className="mt-9 w-full items-center rounded-lg border border-border bg-surface-1 px-6 py-8">
            <Caption className="uppercase tracking-[2px] text-text-muted">Invite code</Caption>
            <Display className="mt-3 tracking-[6px] text-violet-300">{inviteCode}</Display>
          </View>

          <View className="mt-8 w-full gap-3">
            <Button label="Share invite" icon="share" onPress={shareInvite} />
            <Button
              variant="ghost"
              label="Done"
              onPress={() => router.replace('/(tabs)/circle')}
            />
          </View>
        </View>
      </Screen>
    );
  }

  // ── Create form ──────────────────────────────────────────────────────────
  return (
    <Screen scroll>
      <View className="mb-6 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Heading className="font-display text-[28px] leading-[34px]">Start a Circle</Heading>
          <Body className="mt-1 text-text-secondary">Habits stick when someone&apos;s beside you.</Body>
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

      {/* Name */}
      <Label className="mb-2 text-text-secondary">Circle name</Label>
      <TextInput
        value={name}
        onChangeText={setName}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Morning crew"
        placeholderTextColor="#8C879B"
        returnKeyType="done"
        maxLength={40}
        className={`h-12 rounded-lg border bg-surface-2 px-4 font-sans text-[16px] text-text-primary ${
          focused ? 'border-violet-500' : 'border-transparent'
        }`}
      />
      <Caption className="mt-2">Circles are small — up to 6 people. Keep it close.</Caption>

      {/* Visibility */}
      <Label className="mb-2 mt-7 text-text-secondary">Who can join</Label>
      <View className="flex-row gap-2">
        <Chip
          label="Private"
          icon="lock"
          selected={visibility === 'private'}
          onPress={() => setVisibility('private')}
        />
        <Chip
          label="Public"
          icon="globe"
          selected={visibility === 'public'}
          onPress={() => setVisibility('public')}
        />
      </View>
      <Caption className="mt-2">
        {visibility === 'private'
          ? 'Invite-only. Just the people you choose.'
          : 'Anyone with the link can join until it fills up.'}
      </Caption>

      <View className="mt-10">
        <Button label="Create" icon="arrow-right" onPress={handleCreate} />
      </View>
    </Screen>
  );
}
