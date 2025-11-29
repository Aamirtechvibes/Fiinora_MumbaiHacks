import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import type { AuthState } from '../../src/store/authStore';

export default function TabsLayout() {
  const router = useRouter();
  const accessToken = useAuthStore((state: AuthState) => state.accessToken);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/(auth)/login');
    }
  }, [accessToken, router]);

  if (!accessToken) {
    return null;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

