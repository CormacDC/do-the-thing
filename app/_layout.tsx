import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import '@/lib/supabase';
import { colors } from '@/lib/theme';

// Future routes: /onboarding (Sprint 4), /sign-in (Sprint 5)

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
