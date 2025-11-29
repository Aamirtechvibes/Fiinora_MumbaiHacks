import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [accessToken, router]);

  return null;
}

