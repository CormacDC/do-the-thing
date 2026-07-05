import type { ReactNode } from 'react';
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
import { colors, spacing, typography } from '@/lib/theme';

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
              <ActivityIndicator color={colors.textMuted} />
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
  return (
    <View style={styles.oauthGroup}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={({ pressed }) => [
          styles.oauthButton,
          disabled && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
        onPress={onGoogle}
      >
        <Text style={styles.oauthLabel}>Continue with Google</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={({ pressed }) => [
          styles.oauthButton,
          disabled && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
        onPress={onApple}
      >
        <Text style={styles.oauthLabel}>Continue with Apple</Text>
      </Pressable>
    </View>
  );
}

type AuthLinkProps = {
  prompt: string;
  href: '/sign-in' | '/sign-up';
  label: string;
};

export function AuthLink({ prompt, href, label }: AuthLinkProps) {
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

export const authFieldStyles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  primaryButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryLabel: {
    ...typography.label,
    color: colors.background,
  },
  errorBanner: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.priorityMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.priority,
  },
  errorText: {
    ...typography.caption,
    color: colors.priority,
  },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  oauthGroup: {
    gap: spacing.sm,
  },
  oauthButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },
  oauthLabel: {
    ...typography.label,
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  loadingRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  linkPrompt: {
    ...typography.caption,
    color: colors.textMuted,
  },
  linkLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});
