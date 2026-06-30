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

import { useProfile } from '@/hooks/useProfile';
import { formatPhoneHint, isValidE164Phone } from '@/lib/phone';
import { SMS_COPY, SMS_DEFAULT_PREVIEW, SMS_TOKEN_HINT } from '@/lib/smsCopy';
import { replaceSmsTokens } from '@/lib/smsMessage';
import { colors, spacing, typography } from '@/lib/theme';
import type { ProfileInsert } from '@/types/profile';

type Step = 1 | 2 | 3 | 4;

export function OnboardingFlow() {
  const { createProfile, mutationError, dismissMutationError } = useProfile();

  const [step, setStep] = useState<Step>(1);
  const [displayName, setDisplayName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [customSms, setCustomSms] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const previewName = displayName.trim() || 'Alex';

  const clearErrors = () => {
    setValidationError(null);
    dismissMutationError();
  };

  const handleContinueStep1 = () => {
    clearErrors();
    if (!displayName.trim()) {
      setValidationError('Enter your display name to continue.');
      return;
    }
    setStep(2);
  };

  const handleContinueStep2 = () => {
    clearErrors();
    if (!partnerName.trim()) {
      setValidationError("Enter your partner's name to continue.");
      return;
    }
    if (!isValidE164Phone(partnerPhone)) {
      setValidationError(`Enter a valid phone number. ${formatPhoneHint()}`);
      return;
    }
    setStep(3);
  };

  const handleContinueStep3 = () => {
    clearErrors();
    setStep(4);
  };

  const finishOnboarding = async (useCustomSms: boolean) => {
    clearErrors();
    setSubmitting(true);

    const payload: ProfileInsert = {
      displayName: displayName.trim(),
      partnerName: partnerName.trim(),
      partnerPhone: partnerPhone.trim(),
      customSms: useCustomSms ? customSms.trim() || null : null,
    };

    await createProfile(payload);
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
          <Text style={styles.progressLabel}>Step {step} of 4</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
          </View>
        </View>

        {step === 1 ? (
          <StepShell
            title="What should we call you?"
            subtitle="Your accountability partner will see this name in texts."
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
              onSubmitEditing={handleContinueStep1}
            />
            <PrimaryButton label="Continue" onPress={handleContinueStep1} />
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell
            title="Who keeps you honest?"
            subtitle="Enter your accountability partner's name and phone number."
          >
            <TextInput
              style={styles.input}
              placeholder="Partner name"
              placeholderTextColor={colors.textMuted}
              value={partnerName}
              onChangeText={setPartnerName}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder={formatPhoneHint()}
              placeholderTextColor={colors.textMuted}
              value={partnerPhone}
              onChangeText={setPartnerPhone}
              keyboardType="phone-pad"
              autoCorrect={false}
              textContentType="telephoneNumber"
            />
            <PrimaryButton label="Continue" onPress={handleContinueStep2} />
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell
            title="Before we save this"
            subtitle="Please read and acknowledge the following."
          >
            <View style={styles.consentBox}>
              <Text style={styles.consentText}>
                If you miss your daily quota, {partnerName.trim() || 'your partner'} will
                automatically receive an SMS letting them know. You can update partner
                details later in Settings.
              </Text>
            </View>
            <PrimaryButton
              label="I understand — continue"
              onPress={handleContinueStep3}
            />
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell
            title="Customize the text?"
            subtitle="Optional. Leave blank to use the default message."
          >
            <View style={styles.defaultCopyBox}>
              <Text style={styles.defaultCopyLabel}>Default message</Text>
              <Text style={styles.defaultCopyText}>
                {replaceSmsTokens(SMS_DEFAULT_PREVIEW, {
                  name: previewName,
                  completed: 0,
                  quota: 3,
                })}
              </Text>
              <Text style={styles.defaultCopyHint}>{SMS_TOKEN_HINT}</Text>
              <Text style={styles.defaultCopyExamples}>
                Partial:{' '}
                {replaceSmsTokens(SMS_COPY.partialMiss, {
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
              value={customSms}
              onChangeText={setCustomSms}
              multiline
              textAlignVertical="top"
              autoCorrect={false}
            />
            <PrimaryButton
              label={submitting ? 'Saving…' : 'Save and continue'}
              disabled={submitting}
              onPress={handleFinishWithCustom}
            />
            <SecondaryButton
              label={submitting ? 'Saving…' : 'Use default message'}
              disabled={submitting}
              onPress={handleSkipCustom}
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
