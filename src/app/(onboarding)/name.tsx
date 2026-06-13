import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Dots } from '@/components/ui/dots';
import { Screen } from '@/components/ui/screen';
import { Body, Caption, Display } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/useAppStore';

export default function NameScreen() {
  const setProfile = useAppStore((s) => s.setProfile);
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);

  const handleContinue = () => {
    setProfile({ name: name.trim() });
    router.push('/(onboarding)/habits');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <View className="flex-1 justify-between py-6">
          <View>
            <Dots total={4} step={2} className="mb-10" />
            <Display className="text-text-primary">What should{'\n'}we call you?</Display>
            <Body className="mt-3 text-text-secondary">
              Just a first name is perfect. You can change it later.
            </Body>

            <TextInput
              value={name}
              onChangeText={setName}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Your name"
              placeholderTextColor="#6E6E85"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              className={cn(
                'mt-10 rounded-lg border bg-surface-2 px-4 py-4 font-sans-regular text-lg text-text-primary',
                focused ? 'border-violet-500' : 'border-border',
              )}
            />
          </View>

          <View className="gap-4">
            <Button label="Continue" icon="arrow-right" onPress={handleContinue} />
            <Button variant="ghost" label="Skip for now" onPress={handleContinue} />
            <Caption className="text-center text-text-muted">No pressure either way.</Caption>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
