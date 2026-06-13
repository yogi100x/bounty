import { useSSO } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { hapticTap } from '@/lib/haptics';

// Ensures the OAuth browser session completes/redirects correctly.
WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    if (loading) return;
    hapticTap();
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: Linking.createURL('/'),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
      // On success, the root InitialLayout redirects into the app.
    } catch (err) {
      console.warn('Google sign-in failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-4">
        <View className="h-20 w-20 items-center justify-center rounded-lg bg-violet-500/15">
          <Display className="text-violet-300">B</Display>
        </View>
        <Display className="text-center">Bounty</Display>
        <Body className="max-w-[280px] text-center text-text-secondary">
          Build habits that stick — witnessed by a small circle of friends.
        </Body>
      </View>
      <View className="gap-3 pb-10">
        <Button label="Continue with Google" icon="log-in" onPress={onGoogle} loading={loading} />
        <Caption className="text-center">Apple sign-in coming soon.</Caption>
      </View>
    </Screen>
  );
}
