import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading } from '@/components/ui/text';
import { useCircleActions } from '@/data/social';
import { hapticSuccess, hapticTap, hapticWarn } from '@/lib/haptics';

export default function InviteLandingScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const inviteCode = (code ?? '').toUpperCase();
  const actions = useCircleActions();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    hapticTap();
    router.back();
  };

  const handleJoin = async () => {
    if (joining) return;
    setJoining(true);
    setError(null);
    try {
      await actions.joinByCode(inviteCode);
      hapticSuccess();
      router.replace('/(tabs)/circle');
    } catch {
      setError("We couldn't join that Circle. The code may be invalid or the Circle is full.");
      hapticWarn();
    } finally {
      setJoining(false);
    }
  };

  return (
    <Screen>
      <View className="mb-2 flex-row items-center justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={close}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-1">
          <Feather name="x" size={20} color="#C9C5D6" />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center pb-12">
        <View
          className="h-20 w-20 items-center justify-center rounded-pill border border-border bg-surface-1"
          style={{
            shadowColor: '#A78BFA',
            shadowOpacity: 0.22,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          }}>
          <Feather name="users" size={34} color="#C4B5FD" />
        </View>

        <Heading className="mt-7 text-center">You&apos;re invited to a Circle</Heading>
        <Body className="mt-3 max-w-[300px] text-center text-text-secondary">
          A friend wants you beside them. Join and cheer each other on, one day at a time.
        </Body>

        <Card className="mt-8 w-full max-w-[320px] items-center bg-surface-1 py-7">
          <Caption className="uppercase tracking-[2px] text-text-muted">Invite code</Caption>
          <Display className="mt-3 tracking-[6px] text-violet-300">{inviteCode}</Display>
        </Card>

        <View className="mt-8 w-full max-w-[320px]">
          <Button label="Join Circle" icon="arrow-right" loading={joining} onPress={handleJoin} />
        </View>

        {error ? (
          <Caption className="mt-4 max-w-[300px] text-center text-danger">{error}</Caption>
        ) : null}

        <Caption className="mt-4 max-w-[300px] text-center">
          Circles are small — up to 6 people. You can leave anytime.
        </Caption>
      </View>
    </Screen>
  );
}
