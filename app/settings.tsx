import { useEffect, useState } from 'react';
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
import { router, Redirect, type Href } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { formatPhoneHint, isValidE164Phone, maskPhoneNumber } from '@/lib/phone';
import { SMS_COPY, SMS_TOKEN_HINT } from '@/lib/smsCopy';
import { replaceSmsTokens } from '@/lib/smsMessage';
import { colors, spacing, typography } from '@/lib/theme';

export default function SettingsScreen() {
  const auth = useAuth();
  const {
    profile,
    loading,
    error,
    mutationError,
    dismissMutationError,
    updateProfileSettings,
    retry,
  } = useProfile();

  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [customSms, setCustomSms] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !initialized) {
      setPartnerName(profile.partnerName);
      setPartnerPhone(profile.partnerPhone);
      setCustomSms(profile.customSms ?? '');
      setInitialized(true);
    }
  }, [profile, initialized]);

  const handleSave = async () => {
    setValidationError(null);
    dismissMutationError();

    if (!partnerName.trim()) {
      setValidationError("Enter your partner's name.");
      return;
    }
    const phoneToSave = editingPhone ? partnerPhone.trim() : profile!.partnerPhone;

    if (!isValidE164Phone(phoneToSave)) {
      setValidationError(`Enter a valid phone number. ${formatPhoneHint()}`);
      return;
    }

    setSaving(true);
    const ok = await updateProfileSettings({
      partnerName: partnerName.trim(),
      partnerPhone: phoneToSave,
      customSms: customSms.trim() || null,
    });
    setSaving(false);

    if (ok) {
      setEditingPhone(false);
      router.back();
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error: signOutError } = await auth.signOut();
    setSigningOut(false);

    if (signOutError) {
      setValidationError(signOutError);
      return;
    }

    router.replace('/sign-in' as Href);
  };

  if (loading && !profile) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      </Screen>
    );
  }

  if (error && !profile) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Couldn&apos;t load settings</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable accessibilityRole="button" style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  if (!auth.session) {
    return <Redirect href={'/sign-in' as Href} />;
  }

  const previewName = profile.displayName;
  const formError = validationError ?? mutationError;

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backRow}
            onPress={() => router.back()}
          >
            <Text style={styles.backLabel}>← Back</Text>
          </Pressable>

          <Text style={styles.title}>Settings</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Display name</Text>
            <Text style={styles.readOnlyValue}>{profile.displayName}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Partner name</Text>
            <TextInput
              style={styles.input}
              value={partnerName}
              onChangeText={setPartnerName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Partner phone</Text>
            {editingPhone ? (
              <TextInput
                style={styles.input}
                value={partnerPhone}
                onChangeText={setPartnerPhone}
                keyboardType="phone-pad"
                autoCorrect={false}
                placeholder={formatPhoneHint()}
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
            ) : (
              <View style={styles.phoneRow}>
                <Text style={styles.maskedPhone}>{maskPhoneNumber(profile.partnerPhone)}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setPartnerPhone(profile.partnerPhone);
                    setEditingPhone(true);
                  }}
                >
                  <Text style={styles.editLink}>Edit</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Custom SMS message</Text>
            <Text style={styles.hint}>{SMS_TOKEN_HINT}</Text>
            <Text style={styles.defaultPreview}>
              Default:{' '}
              {replaceSmsTokens(SMS_COPY.fullMiss, {
                name: previewName,
                completed: 0,
                quota: 3,
              })}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={customSms}
              onChangeText={setCustomSms}
              multiline
              textAlignVertical="top"
              placeholder="Leave blank to use default"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
            />
          </View>

          {formError ? (
            <Pressable
              accessibilityRole="button"
              style={styles.errorBanner}
              onPress={() => {
                setValidationError(null);
                dismissMutationError();
              }}
            >
              <Text style={styles.errorText}>{formError}</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            style={({ pressed }) => [
              styles.saveButton,
              saving && styles.saveButtonDisabled,
              pressed && !saving && styles.saveButtonPressed,
            ]}
            onPress={handleSave}
          >
            <Text style={styles.saveLabel}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={signingOut}
            style={({ pressed }) => [
              styles.signOutButton,
              signingOut && styles.saveButtonDisabled,
              pressed && !signingOut && styles.signOutButtonPressed,
            ]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutLabel}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  backRow: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  readOnlyValue: {
    ...typography.body,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
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
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  defaultPreview: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
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
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveLabel: {
    ...typography.label,
    color: colors.background,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  maskedPhone: {
    ...typography.body,
    color: colors.textMuted,
  },
  editLink: {
    ...typography.label,
    color: colors.text,
  },
  signOutButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  signOutButtonPressed: {
    opacity: 0.85,
  },
  signOutLabel: {
    ...typography.label,
    color: colors.textMuted,
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
  retryButton: {
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
