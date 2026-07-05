import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';

import { Screen } from '@/components/Screen';
import { TaskList } from '@/components/TaskList';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { colors, spacing, typography } from '@/lib/theme';

export default function HomeScreen() {
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

  if (error && !profile) {
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

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen>
      <TaskList />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
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
