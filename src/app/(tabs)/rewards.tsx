import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display, Heading, Label } from '@/components/ui/text';

const BALANCE = 340;

type Reward = {
  id: string;
  title: string;
  cost: number;
  icon: React.ComponentProps<typeof Feather>['name'];
};

const REWARDS: Reward[] = [
  { id: 'movie', title: 'Movie night', cost: 200, icon: 'film' },
  { id: 'coffee', title: 'Fancy coffee', cost: 120, icon: 'coffee' },
  { id: 'gear', title: 'New running gear', cost: 500, icon: 'shopping-bag' },
];

function RewardCard({ reward }: { reward: Reward }) {
  const affordable = BALANCE >= reward.cost;
  const toGo = reward.cost - BALANCE;

  return (
    <Card className="mb-3 flex-row items-center p-4">
      <View className="h-12 w-12 items-center justify-center rounded-md border border-border bg-surface-2">
        <Feather name={reward.icon} size={20} color="#C4B5FD" />
      </View>
      <View className="ml-3 flex-1">
        <Label className="text-text-primary">{reward.title}</Label>
        <Caption className="mt-0.5">{reward.cost} pts</Caption>
      </View>
      {affordable ? (
        <View className="rounded-pill border border-violet-500 bg-violet-500/15 px-3 py-1.5">
          <Caption className="text-violet-300">Redeem</Caption>
        </View>
      ) : (
        <View className="items-end">
          <Caption className="text-text-secondary">{toGo} to go</Caption>
        </View>
      )}
    </Card>
  );
}

export default function RewardsScreen() {
  return (
    <Screen scroll>
      <Heading className="mb-2 mt-2 text-text-secondary">Rewards</Heading>

      <Card className="mt-1 items-center py-7">
        <Caption className="text-text-secondary">Points balance</Caption>
        <Display className="mt-1 text-violet-300">{BALANCE}</Display>
        <Body className="mt-1 text-text-secondary">Keep showing up to earn more.</Body>
      </Card>

      <Heading className="mb-3 mt-7">Catalog</Heading>
      {REWARDS.map((r) => (
        <RewardCard key={r.id} reward={r} />
      ))}
    </Screen>
  );
}
