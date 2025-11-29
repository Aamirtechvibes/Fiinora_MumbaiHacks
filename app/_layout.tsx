import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// react-native-reanimated removed for Expo Go compatibility during development
import { ActivityIndicator, View } from 'react-native';
import useAuth from '../src/hooks/useAuth';

export default function RootLayout() {
  const { ready } = useAuth();

  useEffect(() => {
    // (onboarding removed) no bootstrap required
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}

