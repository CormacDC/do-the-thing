import { useMemo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, type Href } from 'expo-router';

import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  loading?: boolean;
};

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
  loading = false,
}: AuthScreenLayoutProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {children}

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.colors.textSecondary} />
            </View>
          ) : null}

          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

type OAuthButtonsProps = {
  onGoogle: () => void;
  onApple: () => void;
  disabled?: boolean;
};

export function OAuthButtons({ onGoogle, onApple, disabled = false }: OAuthButtonsProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.oauthGroup}>
      <SecondaryButton
        label="Continue with Google"
        disabled={disabled}
        onPress={onGoogle}
      />
      <SecondaryButton
        label="Continue with Apple"
        disabled={disabled}
        onPress={onApple}
      />
    </View>
  );
}

type AuthLinkProps = {
  prompt: string;
  href: '/sign-in' | '/sign-up';
  label: string;
};

export function AuthLink({ prompt, href, label }: AuthLinkProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.linkRow}>
      <Text style={styles.linkPrompt}>{prompt}</Text>
      <Link href={href as Href} asChild>
        <Pressable accessibilityRole="link">
          <Text style={styles.linkLabel}>{label}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxl,
      gap: theme.spacing.lg,
    },
    header: {
      gap: theme.spacing.sm,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    loadingRow: {
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    footer: {
      marginTop: theme.spacing.md,
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    linkPrompt: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    linkLabel: {
      ...theme.typography.caption,
      color: theme.colors.accent,
      fontWeight: '600',
    },
    oauthGroup: {
      gap: theme.spacing.sm,
    },
  });
}
