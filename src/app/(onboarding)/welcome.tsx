import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Dots } from '@/components/ui/dots';
import { Screen } from '@/components/ui/screen';
import { Body, Display, Heading } from '@/components/ui/text';

type Point = {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
};

const POINTS: Point[] = [
  {
    icon: 'check-circle',
    title: 'Pick a habit',
    body: 'Choose one thing that matters. One is enough to begin.',
  },
  {
    icon: 'camera',
    title: 'Prove it',
    body: 'A quick daily check-in. Show up, mark it done.',
  },
  {
    icon: 'users',
    title: 'Keep the streak',
    body: 'Watch it grow, witnessed by the Circle you choose.',
  },
];

function PointRow({ point }: { point: Point }) {
  return (
    <View className="flex-row items-start gap-4">
      <View className="h-11 w-11 items-center justify-center rounded-md bg-violet-500/15">
        <Feather name={point.icon} size={20} color="#C4B5FD" />
      </View>
      <View className="flex-1 pt-0.5">
        <Heading className="text-text-primary">{point.title}</Heading>
        <Body className="mt-1 text-text-secondary">{point.body}</Body>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  return (
    <Screen>
      <View className="flex-1 justify-between py-6">
        <View>
          <Dots total={4} step={1} className="mb-10" />
          <Display className="text-text-primary">Small steps,{'\n'}seen by your people.</Display>
          <Body className="mt-3 text-text-secondary">Here is how Bounty works.</Body>

          <View className="mt-12 gap-7">
            {POINTS.map((point) => (
              <PointRow key={point.title} point={point} />
            ))}
          </View>
        </View>

        <Button
          label="Get started"
          icon="arrow-right"
          onPress={() => router.push('/(onboarding)/name')}
        />
      </View>
    </Screen>
  );
}
