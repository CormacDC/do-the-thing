import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { FileQuestion } from 'lucide-react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <EmptyState
          icon={FileQuestion}
          title="Page not found"
          action={
            <PrimaryButton
              label="Back to tasks"
              onPress={() => router.replace('/')}
            />
          }
        />
      </View>
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
    },
  });
}
