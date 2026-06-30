import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppStateProvider } from '@/lib/appState';
import { AuthProvider } from '@/lib/auth';
import { ProfileProvider } from '@/lib/profile';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AppStateProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="onboarding"
              options={{ gestureEnabled: false, animation: 'fade' }}
            />
            <Stack.Screen name="settings" />
          </Stack>
        </AppStateProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
