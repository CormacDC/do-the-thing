import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PushTokenRegistrar } from '@/components/PushTokenRegistrar';
import { useTheme } from '@/hooks/useTheme';
import { AppStateProvider } from '@/lib/appState';
import { AuthProvider } from '@/lib/auth';
import { ProfileProvider } from '@/lib/profile';
import { ThemeProvider } from '@/lib/ThemeProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <RootLayoutInner />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutInner() {
  const theme = useTheme();

  return (
    <AuthProvider>
      <ProfileProvider>
        <AppStateProvider>
          <PushTokenRegistrar />
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="sign-in"
              options={{ gestureEnabled: false, animation: 'fade' }}
            />
            <Stack.Screen name="sign-up" />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
