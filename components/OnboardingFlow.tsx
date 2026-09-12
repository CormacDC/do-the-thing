import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MessageSquare, UserPlus, UserRound } from 'lucide-react-native';

import { Banner } from '@/components/ui/Banner';
import { PrimaryButton, SecondaryButton, TextButton } from '@/components/ui/Button';
import { FriendCodeCard } from '@/components/ui/FriendCodeCard';
import { Surface } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import {
  ACCOUNTABILITY_COPY,
  ACCOUNTABILITY_DEFAULT_PREVIEW,
  ACCOUNTABILITY_TOKEN_HINT,
} from '@/lib/accountabilityCopy';
import { replaceAccountabilityTokens } from '@/lib/accountabilityMessage';
import type { Theme } from '@/lib/theme';

type Step = 1 | 2 | 3;

export function OnboardingFlow() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
            <TextField
              icon={UserRound}
              placeholder="Display name"
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
              loading={submitting}
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
            <FriendCodeCard code={myCode} hint="" />
            <TextField
              icon={UserPlus}
              placeholder="Friend's code (optional)"
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
            <Surface>
              <Text style={styles.consentText}>
                Selected friends will get a push notification if you miss your daily quota.
                You choose who is notified in Settings. At least one notify target is required
                before you can set a quota.
              </Text>
            </Surface>
            <PrimaryButton label="Continue" onPress={handleContinueStep2} />
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell
            title="Customize the message?"
            subtitle="Optional. Leave blank to use the default push notification copy."
          >
            <Surface>
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
            </Surface>
            <TextField
              icon={MessageSquare}
              placeholder="Custom message (optional)"
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              autoCorrect={false}
            />
            <PrimaryButton
              label={submitting ? 'Saving…' : 'Save and continue'}
              loading={submitting}
              onPress={() => {
                void handleFinishWithCustom();
              }}
            />
            <TextButton
              label={submitting ? 'Saving…' : 'Use default message'}
              disabled={submitting}
              onPress={() => {
                void handleSkipCustom();
              }}
            />
          </StepShell>
        ) : null}

        {errorMessage ? (
          <Banner tone="error" body={errorMessage} onPress={clearErrors} />
        ) : null}

        {submitting ? (
          <View style={styles.savingOverlay}>
            <ActivityIndicator color={theme.colors.textSecondary} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type StepShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

function StepShell({ title, subtitle, children }: StepShellProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.step}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    progress: {
      gap: theme.spacing.sm,
    },
    progressLabel: {
      ...theme.typography.overline,
      color: theme.colors.textSecondary,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.accent,
      borderRadius: 2,
    },
    step: {
      gap: theme.spacing.md,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    stepBody: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    noteText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    consentText: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      lineHeight: 24,
    },
    defaultCopyLabel: {
      ...theme.typography.label,
      color: theme.colors.textPrimary,
    },
    defaultCopyText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    defaultCopyHint: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    defaultCopyExamples: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    savingOverlay: {
      alignItems: 'center',
      paddingTop: theme.spacing.sm,
    },
  });
}
