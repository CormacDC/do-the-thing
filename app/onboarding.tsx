import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';

import { OnboardingFlow } from '@/components/OnboardingFlow';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { SecondaryButton } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

export default function OnboardingScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const auth = useAuth();
  const { profile, loading, error, retry } = useProfile();

  if (auth.loading || loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.textSecondary} />
        </View>
      </Screen>
    );
  }

  if (!auth.session) {
    return <Redirect href={'/sign-in' as Href} />;
  }

  if (auth.error) {
    return (
      <Screen>
        <EmptyState title="Can't sign in" body={auth.error} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <EmptyState
          title="Couldn't load profile"
          body={error}
          action={<SecondaryButton label="Try again" onPress={retry} />}
        />
      </Screen>
    );
  }

  if (profile?.onboardingComplete) {
    return <Redirect href="/" />;
  }

  return (
    <Screen>
      <OnboardingFlow />
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
  });
}
