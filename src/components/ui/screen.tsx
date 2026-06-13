import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import { Title } from '@/components/ui/text';

export type ScreenProps = {
  children: React.ReactNode;
  /** Wrap children in a ScrollView with tab-bar-clearing bottom padding. */
  scroll?: boolean;
  /** Optional screen title rendered at the top. */
  title?: string;
  /** Override the default horizontal padding (px-5). */
  className?: string;
  /** Extra classes for the inner content container. */
  contentClassName?: string;
};

export function Screen({
  children,
  scroll = false,
  title,
  className,
  contentClassName,
}: ScreenProps) {
  const header = title ? <Title className="mb-2 mt-2">{title}</Title> : null;

  if (scroll) {
    return (
      <SafeAreaView edges={['top']} className={cn('flex-1 bg-bg px-5', className)}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
          className={contentClassName}>
          {header}
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className={cn('flex-1 bg-bg px-5', className)}>
      <View className={cn('flex-1 pt-2', contentClassName)}>
        {header}
        {children}
      </View>
    </SafeAreaView>
  );
}
