import { Stack } from 'expo-router';

/** Onboarding flow — its own stack, no headers, dark canvas (DESIGN-SPEC dark-first). */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0E0E16' },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="name" />
      <Stack.Screen name="habits" />
      <Stack.Screen name="notify" />
    </Stack>
  );
}
