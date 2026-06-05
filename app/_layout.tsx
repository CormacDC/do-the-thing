import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppStateProvider } from '@/lib/appState';
import { AuthProvider } from '@/lib/auth';
import { colors } from '@/lib/theme';

// Future routes: /onboarding (Sprint 4), /sign-in (Sprint 5)

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </AppStateProvider>
    </AuthProvider>
  );
}
