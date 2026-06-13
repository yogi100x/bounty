import { Feather } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useSnapshot } from '@/data/core';

const ACTIVE = '#A78BFA'; // violet-400
const INACTIVE = '#6E6E85'; // text-muted

export default function TabsLayout() {
  const snap = useSnapshot();

  // Loading: wait for the snapshot before deciding where to send the user.
  if (snap === undefined) return null;

  // Gate: first-run users go through onboarding before reaching the tabs.
  if (!snap.profile.onboarded) return <Redirect href="/(onboarding)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#14141F', // surface-1
          borderTopColor: '#2E2E40', // border
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Feather name="sun" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Circle',
          tabBarIcon: ({ color, size }) => <Feather name="users" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }) => <Feather name="gift" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
