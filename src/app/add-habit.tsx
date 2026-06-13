import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Heading, Label, Title } from '@/components/ui/text';
import { hapticTap } from '@/lib/haptics';
import type { FeatherIcon } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

const ICON_OPTIONS: FeatherIcon[] = [
  'check-circle',
  'activity',
  'book-open',
  'droplet',
  'heart',
  'sun',
  'moon',
  'feather',
  'edit-3',
  'coffee',
];

export default function AddHabitScreen() {
  const addCustomHabit = useAppStore((s) => s.addCustomHabit);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<FeatherIcon>('check-circle');
  const [proofRequired, setProofRequired] = useState(false);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    addCustomHabit({
      name: trimmed,
      icon,
      category: 'Custom',
      cadence: { kind: 'daily' },
      proofRequired,
      pointValue: 10,
    });
    router.back();
  };

  return (
    <Screen scroll>
      <View className="mb-1 mt-2 flex-row items-center justify-between">
        <Title>New habit</Title>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          hitSlop={12}
          onPress={() => router.back()}>
          <Feather name="x" size={24} color="#B9B9CC" />
        </Pressable>
      </View>
      <Body className="mb-6 text-text-secondary">Design something you&rsquo;ll show up for.</Body>

      {/* Name */}
      <Label className="mb-2 text-text-secondary">Name</Label>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Practice guitar"
        placeholderTextColor="#6E6E85"
        returnKeyType="done"
        onSubmitEditing={handleSave}
        className="rounded-lg border border-border bg-surface-2 px-4 py-3.5 font-sans text-[16px] text-text-primary"
      />

      {/* Icon picker */}
      <Label className="mb-2 mt-6 text-text-secondary">Icon</Label>
      <View className="flex-row flex-wrap gap-3">
        {ICON_OPTIONS.map((opt) => {
          const selected = opt === icon;
          return (
            <Pressable
              key={opt}
              accessibilityRole="button"
              accessibilityLabel={`Icon ${opt}`}
              accessibilityState={{ selected }}
              onPress={() => {
                hapticTap();
                setIcon(opt);
              }}
              className="h-12 w-12 items-center justify-center rounded-md border"
              style={{
                borderColor: selected ? '#8B5CF6' : '#2E2E40',
                backgroundColor: selected ? 'rgba(139,92,246,0.15)' : '#1C1C2A',
              }}>
              <Feather name={opt} size={20} color={selected ? '#C4B5FD' : '#B9B9CC'} />
            </Pressable>
          );
        })}
      </View>

      {/* Proof toggle */}
      <Label className="mb-1 mt-6 text-text-secondary">Proof</Label>
      <Caption className="mb-2">Snap a photo to prove it — worth a few bonus points.</Caption>
      <View className="flex-row gap-2">
        <Chip
          label="No proof"
          icon="check"
          selected={!proofRequired}
          onPress={() => setProofRequired(false)}
        />
        <Chip
          label="Photo proof"
          icon="camera"
          selected={proofRequired}
          onPress={() => setProofRequired(true)}
        />
      </View>

      {/* Cadence note (daily default for V1) */}
      <Label className="mb-1 mt-6 text-text-secondary">Cadence</Label>
      <View className="flex-row items-center gap-2 self-start rounded-pill border border-border bg-surface-1 px-4 py-2">
        <Feather name="repeat" size={14} color="#B9B9CC" />
        <Label className="text-text-secondary">Every day</Label>
      </View>

      {/* Actions */}
      <View className="mt-8 gap-3">
        <Button label="Add habit" disabled={!canSave} onPress={handleSave} />
        <Button variant="ghost" label="Cancel" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
