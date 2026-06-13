import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Label, Title } from '@/components/ui/text';
import { useRedemptions } from '@/data/social';
import { hapticTap } from '@/lib/haptics';

type Redemption = NonNullable<ReturnType<typeof useRedemptions>>[number];

function relativeDate(ts: number): string {
  const diffMs = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (diffMs < 60 * 1000) return 'just now';
  if (diffMs < 60 * 60 * 1000) {
    const m = Math.floor(diffMs / (60 * 1000));
    return `${m} min${m === 1 ? '' : 's'} ago`;
  }
  if (days < 1) {
    const h = Math.floor(diffMs / (60 * 60 * 1000));
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function HistoryRow({ item }: { item: Redemption }) {
  return (
    <Card className="mb-3 flex-row items-center p-4">
      <View className="h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-2">
        <Feather name="gift" size={18} color="#C4B5FD" />
      </View>
      <View className="ml-3 flex-1">
        <Label className="text-text-primary">{item.title}</Label>
        <Caption className="mt-0.5 text-text-secondary">{relativeDate(item.createdAt)}</Caption>
      </View>
      <View className="flex-row items-center gap-1">
        <Feather name="zap" size={13} color="#6F6F87" />
        <Label className="text-text-secondary">{item.cost}</Label>
      </View>
    </Card>
  );
}

export default function RedemptionHistoryScreen() {
  const redemptions = useRedemptions();

  const close = () => {
    hapticTap();
    if (router.canGoBack()) router.back();
    else router.replace('/rewards');
  };

  return (
    <Screen scroll>
      <View className="mb-5 mt-2 flex-row items-center justify-between">
        <Title>Redemption history</Title>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={close}
          className="h-9 w-9 items-center justify-center rounded-pill border border-border bg-surface-1">
          <Feather name="x" size={18} color="#B9B9CC" />
        </Pressable>
      </View>

      {redemptions === undefined ? (
        <View className="mt-24 items-center">
          <ActivityIndicator color="#C4B5FD" />
        </View>
      ) : redemptions.length === 0 ? (
        <View className="mt-24 items-center gap-4 px-6">
          <View className="h-16 w-16 items-center justify-center rounded-pill bg-surface-2">
            <Feather name="gift" size={28} color="#6F6F87" />
          </View>
          <Body className="text-center text-text-secondary">
            No redemptions yet — your first one is coming.
          </Body>
        </View>
      ) : (
        redemptions.map((item) => <HistoryRow key={item.id} item={item} />)
      )}
    </Screen>
  );
}
