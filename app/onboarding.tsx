import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';

import { OnboardingFlow } from '@/components/OnboardingFlow';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { colors, spacing, typography } from '@/lib/theme';

export default function OnboardingScreen() {
  const auth = useAuth();
  const { profile, loading, error, retry } = useProfile();

  if (auth.loading || loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textMuted} />
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
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Can&apos;t sign in</Text>
          <Text style={styles.errorBody}>{auth.error}</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Couldn&apos;t load profile</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable accessibilityRole="button" style={styles.retry} onPress={retry}>
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (profile) {
    return <Redirect href="/" />;
  }

  return (
    <Screen>
      <OnboardingFlow />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  errorTitle: {
    ...typography.label,
    color: colors.text,
  },
  errorBody: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryLabel: {
    ...typography.label,
    color: colors.text,
  },
});
