import '@/global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';

import { PushRegistrar } from '@/components/push-registrar';
import { DEMO_AWARD, PRESENTATION } from '@/lib/demo';
import { configureNotifications } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();
configureNotifications();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

/**
 * Auth gate: redirect signed-out users to the sign-in screen, and bounce
 * signed-in users out of the (auth) group. Runs inside ClerkProvider.
 */
function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (PRESENTATION) {
      // Presentation mode: bypass auth + seed an award for the /award screenshot.
      useAppStore.getState().setAward(DEMO_AWARD);
      return;
    }
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, segments, router]);

  return (
    <>
      <PushRegistrar />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0E0E16' },
        }}>
        <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="capture" options={{ presentation: 'modal' }} />
      <Stack.Screen name="circle/create" options={{ presentation: 'modal' }} />
      <Stack.Screen name="circle/join" options={{ presentation: 'modal' }} />
      <Stack.Screen name="invite/[code]" options={{ presentation: 'modal' }} />
      <Stack.Screen
          name="award"
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    'ClashDisplay-Regular': require('@/assets/fonts/ClashDisplay-Regular.ttf'),
    'ClashDisplay-Medium': require('@/assets/fonts/ClashDisplay-Medium.ttf'),
    'ClashDisplay-Semibold': require('@/assets/fonts/ClashDisplay-Semibold.ttf'),
    'ClashDisplay-Bold': require('@/assets/fonts/ClashDisplay-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <InitialLayout />
          </SafeAreaProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
