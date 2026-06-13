import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Body, Heading, Title } from '@/components/ui/text';

export default function CircleScreen() {
  return (
    <Screen>
      <Title className="mb-2 mt-2">Circle</Title>

      <View className="flex-1 items-center justify-center pb-16">
        <View
          className="h-24 w-24 items-center justify-center rounded-pill border border-border bg-surface-1"
          style={{
            shadowColor: '#A78BFA',
            shadowOpacity: 0.2,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          }}>
          <Feather name="users" size={36} color="#C4B5FD" />
        </View>

        <Heading className="mt-7 text-center">Better together</Heading>
        <Body className="mt-3 max-w-[300px] text-center text-text-secondary">
          Your Circle is where the magic happens. Invite a friend to cheer each other on and keep
          your streaks alive.
        </Body>

        <View className="mt-8 w-full max-w-[320px]">
          <Button label="Invite a friend" icon="user-plus" onPress={() => {}} />
        </View>
      </View>
    </Screen>
  );
}
