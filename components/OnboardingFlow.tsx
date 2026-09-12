import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useProfile } from '@/hooks/useProfile';
import {
  ACCOUNTABILITY_COPY,
  ACCOUNTABILITY_DEFAULT_PREVIEW,
  ACCOUNTABILITY_TOKEN_HINT,
} from '@/lib/accountabilityCopy';
import { replaceAccountabilityTokens } from '@/lib/accountabilityMessage';
import { colors, spacing, typography } from '@/lib/theme';

type Step = 1 | 2 | 3;

export function OnboardingFlow() {
  const { userId } = useAuth();
  const { createProfile, completeOnboarding, profile, mutationError, dismissMutationError } =
    useProfile();
  const { requestFriend } = useFriends(userId);

  const [step, setStep] = useState<Step>(profile && !profile.onboardingComplete ? 2 : 1);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [friendRequestNote, setFriendRequestNote] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState(profile?.customSms ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const previewName = displayName.trim() || profile?.displayName || 'Alex';
  const myCode = profile?.friendCode ?? '······';

  const clearErrors = () => {
    setValidationError(null);
    setFriendRequestNote(null);
    dismissMutationError();
  };

  const handleContinueStep1 = async () => {
    clearErrors();
    if (!displayName.trim()) {
      setValidationError('Enter your display name to continue.');
      return;
    }

    setSubmitting(true);
    const ok = await createProfile({ displayName: displayName.trim() });
    setSubmitting(false);

    if (ok) {
      setStep(2);
    }
  };

  const handleSendFriendRequest = async () => {
    clearErrors();
    if (!friendCodeInput.trim()) {
      setValidationError('Enter a friend code, or skip this step.');
      return;
    }

    setSubmitting(true);
    const ok = await requestFriend(friendCodeInput);
    setSubmitting(false);

    if (ok) {
      setFriendRequestNote('Friend request sent. They’ll need to accept it.');
      setFriendCodeInput('');
    }
  };

  const handleContinueStep2 = () => {
    clearErrors();
    setStep(3);
  };

  const finishOnboarding = async (useCustom: boolean) => {
    clearErrors();
    setSubmitting(true);
    await completeOnboarding(useCustom ? customMessage.trim() || null : null);
    setSubmitting(false);
  };

  const handleFinishWithCustom = async () => {
    await finishOnboarding(true);
  };

  const handleSkipCustom = async () => {
    await finishOnboarding(false);
  };

  const errorMessage = validationError ?? mutationError;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.progress}>
          <Text style={styles.progressLabel}>Step {step} of 3</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
        </View>

        {step === 1 ? (
          <StepShell
            title="What should we call you?"
            subtitle="Friends will see this name in accountability notifications."
          >
            <TextInput
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => {
                void handleContinueStep1();
              }}
            />
            <PrimaryButton
              label={submitting ? 'Saving…' : 'Continue'}
              disabled={submitting}
              onPress={() => {
                void handleContinueStep1();
              }}
            />
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell
            title="Add friends"
            subtitle="Share your code so friends with Do The Thing can add you. You can also enter theirs now — optional."
          >
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Your friend code</Text>
              <Text style={styles.codeValue}>{myCode}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Friend's code (optional)"
              placeholderTextColor={colors.textMuted}
              value={friendCodeInput}
              onChangeText={setFriendCodeInput}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
            <SecondaryButton
              label={submitting ? 'Sending…' : 'Send friend request'}
              disabled={submitting}
              onPress={() => {
                void handleSendFriendRequest();
              }}
            />
            {friendRequestNote ? (
              <Text style={styles.noteText}>{friendRequestNote}</Text>
            ) : null}
            <View style={styles.consentBox}>
              <Text style={styles.consentText}>
                Selected friends will get a push notification if you miss your daily quota.
                You choose who is notified in Settings. At least one notify target is required
                before you can set a quota.
              </Text>
            </View>
            <PrimaryButton label="Continue" onPress={handleContinueStep2} />
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell
            title="Customize the message?"
            subtitle="Optional. Leave blank to use the default push notification copy."
          >
            <View style={styles.defaultCopyBox}>
              <Text style={styles.defaultCopyLabel}>Default message</Text>
              <Text style={styles.defaultCopyText}>
                {replaceAccountabilityTokens(ACCOUNTABILITY_DEFAULT_PREVIEW, {
                  name: previewName,
                  completed: 0,
                  quota: 3,
                })}
              </Text>
              <Text style={styles.defaultCopyHint}>{ACCOUNTABILITY_TOKEN_HINT}</Text>
              <Text style={styles.defaultCopyExamples}>
                Partial:{' '}
                {replaceAccountabilityTokens(ACCOUNTABILITY_COPY.partialMiss, {
                  name: previewName,
                  completed: 2,
                  quota: 3,
                })}
              </Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Custom message (optional)"
              placeholderTextColor={colors.textMuted}
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              textAlignVertical="top"
              autoCorrect={false}
            />
            <PrimaryButton
              label={submitting ? 'Saving…' : 'Save and continue'}
              disabled={submitting}
              onPress={() => {
                void handleFinishWithCustom();
              }}
            />
            <SecondaryButton
              label={submitting ? 'Saving…' : 'Use default message'}
              disabled={submitting}
              onPress={() => {
                void handleSkipCustom();
              }}
            />
          </StepShell>
        ) : null}

        {errorMessage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss error"
            style={styles.errorBanner}
            onPress={clearErrors}
          >
            <Text style={styles.errorText}>{errorMessage}</Text>
          </Pressable>
        ) : null}

        {submitting ? (
          <View style={styles.savingOverlay}>
            <ActivityIndicator color={colors.textMuted} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type StepShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function StepShell({ title, subtitle, children }: StepShellProps) {
  return (
    <View style={styles.step}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

type PrimaryButtonProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

function PrimaryButton({ label, disabled = false, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.primaryButtonPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.primaryButtonLabel}>{label}</Text>
    </Pressable>
  );
}

type SecondaryButtonProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

function SecondaryButton({ label, disabled = false, onPress }: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={styles.secondaryButton}
      onPress={onPress}
    >
      <Text style={styles.secondaryButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  progress: {
    gap: spacing.sm,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text,
    borderRadius: 2,
  },
  step: {
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  stepBody: {
    gap: spacing.md,
    marginTop: spacing.sm,
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
  textArea: {
    minHeight: 112,
    paddingTop: spacing.sm + 2,
  },
  codeBox: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    gap: spacing.xs,
    alignItems: 'center',
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeValue: {
    ...typography.title,
    color: colors.text,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  noteText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  consentBox: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
  },
  consentText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  defaultCopyBox: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  defaultCopyLabel: {
    ...typography.label,
    color: colors.text,
  },
  defaultCopyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  defaultCopyHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  defaultCopyExamples: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
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
  primaryButtonLabel: {
    ...typography.label,
    color: colors.background,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryButtonLabel: {
    ...typography.label,
    color: colors.textMuted,
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
  savingOverlay: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
});
