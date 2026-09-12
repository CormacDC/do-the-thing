import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, Redirect, type Href } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useProfile } from '@/hooks/useProfile';
import { usePushToken } from '@/hooks/usePushToken';
import {
  ACCOUNTABILITY_COPY,
  ACCOUNTABILITY_TOKEN_HINT,
} from '@/lib/accountabilityCopy';
import { replaceAccountabilityTokens } from '@/lib/accountabilityMessage';
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
  const {
    friends,
    targetCount,
    loading: friendsLoading,
    error: friendsError,
    mutationError: friendsMutationError,
    dismissMutationError: dismissFriendsError,
    requestFriend,
    respondToFriend,
    setNotifyTarget,
    reload: reloadFriends,
  } = useFriends(auth.userId);
  const push = usePushToken(auth.userId);

  const [customSms, setCustomSms] = useState('');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !initialized) {
      setCustomSms(profile.customSms ?? '');
      setInitialized(true);
    }
  }, [profile, initialized]);

  if (!auth.loading && !auth.session) {
    return <Redirect href={'/sign-in' as Href} />;
  }

  const handleSave = async () => {
    setValidationError(null);
    dismissMutationError();
    dismissFriendsError();

    setSaving(true);
    const ok = await updateProfileSettings({
      customSms: customSms.trim() || null,
    });
    setSaving(false);

    if (ok) {
      router.back();
    }
  };

  const handleAddFriend = async () => {
    setValidationError(null);
    dismissFriendsError();
    const ok = await requestFriend(friendCodeInput);
    if (ok) {
      setFriendCodeInput('');
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await auth.signOut();
    setSigningOut(false);
  };

  const errorMessage =
    validationError ?? mutationError ?? friendsMutationError ?? friendsError;

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
          <Pressable accessibilityRole="button" style={styles.retry} onPress={retry}>
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const pendingFriends = friends.filter((f) => f.status === 'pending');

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
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <Text style={styles.title}>Settings</Text>

          <Text style={styles.section}>Your friend code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeValue}>{profile?.friendCode ?? '—'}</Text>
            <Text style={styles.hint}>Share this so friends can add you.</Text>
          </View>

          <Text style={styles.section}>Add a friend</Text>
          <TextInput
            style={styles.input}
            placeholder="Friend code"
            placeholderTextColor={colors.textMuted}
            value={friendCodeInput}
            onChangeText={setFriendCodeInput}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryAction}
            onPress={() => {
              void handleAddFriend();
            }}
          >
            <Text style={styles.secondaryActionLabel}>Send request</Text>
          </Pressable>

          {pendingFriends.length > 0 ? (
            <>
              <Text style={styles.section}>Pending</Text>
              {pendingFriends.map((friend) => (
                <View key={friend.friendshipId} style={styles.friendRow}>
                  <View style={styles.friendMeta}>
                    <Text style={styles.friendName}>{friend.displayName}</Text>
                    <Text style={styles.hint}>
                      {friend.canRespond ? 'Wants to be friends' : 'Request sent'}
                    </Text>
                  </View>
                  {friend.canRespond ? (
                    <View style={styles.friendActions}>
                      <Pressable
                        onPress={() => {
                          void respondToFriend(friend.friendshipId, true);
                        }}
                      >
                        <Text style={styles.link}>Accept</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          void respondToFriend(friend.friendshipId, false);
                        }}
                      >
                        <Text style={styles.linkMuted}>Decline</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}

          <Text style={styles.section}>Friends & notify targets</Text>
          <Text style={styles.hint}>
            At least one accepted friend must be marked to receive the midnight push.
            {targetCount === 0
              ? ' None selected yet — you cannot set a quota until you pick someone.'
              : ` ${targetCount} selected.`}
          </Text>
          {friendsLoading ? (
            <ActivityIndicator color={colors.textMuted} />
          ) : acceptedFriends.length === 0 ? (
            <Text style={styles.emptyFriends}>No accepted friends yet.</Text>
          ) : (
            acceptedFriends.map((friend) => (
              <View key={friend.friendshipId} style={styles.friendRow}>
                <View style={styles.friendMeta}>
                  <Text style={styles.friendName}>{friend.displayName}</Text>
                  {friend.friendCode ? (
                    <Text style={styles.hint}>{friend.friendCode}</Text>
                  ) : null}
                </View>
                <Switch
                  value={friend.isNotifyTarget}
                  onValueChange={(enabled) => {
                    void setNotifyTarget(friend.friendUserId, enabled);
                  }}
                  trackColor={{ false: colors.border, true: colors.text }}
                  thumbColor={colors.background}
                />
              </View>
            ))
          )}

          <Pressable accessibilityRole="button" onPress={reloadFriends}>
            <Text style={styles.link}>Refresh friends</Text>
          </Pressable>

          <Text style={styles.section}>Push notifications</Text>
          <Text style={styles.hint}>
            {push.permissionGranted === true
              ? 'Permission granted — this device can receive accountability pushes.'
              : push.permissionGranted === false
                ? push.error ??
                  'Notifications are off. Enable them so friends’ misses can reach you.'
                : 'Checking notification permission…'}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryAction}
            onPress={() => {
              void push.refresh();
            }}
          >
            <Text style={styles.secondaryActionLabel}>
              {push.loading ? 'Updating…' : 'Refresh push registration'}
            </Text>
          </Pressable>

          <Text style={styles.section}>Custom message</Text>
          <Text style={styles.hint}>{ACCOUNTABILITY_TOKEN_HINT}</Text>
          <Text style={styles.preview}>
            {replaceAccountabilityTokens(ACCOUNTABILITY_COPY.fullMiss, {
              name: profile?.displayName ?? 'Alex',
              completed: 0,
              quota: 3,
            })}
          </Text>
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

          {errorMessage ? (
            <Pressable
              accessibilityRole="button"
              style={styles.errorBanner}
              onPress={() => {
                setValidationError(null);
                dismissMutationError();
                dismissFriendsError();
              }}
            >
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveDisabled]}
            onPress={() => {
              void handleSave();
            }}
          >
            <Text style={styles.saveLabel}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={signingOut}
            style={styles.signOut}
            onPress={() => {
              void handleSignOut();
            }}
          >
            <Text style={styles.signOutLabel}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  back: {
    ...typography.label,
    color: colors.textMuted,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  section: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  preview: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
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
    minHeight: 100,
    paddingTop: spacing.sm + 2,
  },
  codeBox: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    gap: spacing.xs,
  },
  codeValue: {
    ...typography.title,
    color: colors.text,
    letterSpacing: 4,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  friendMeta: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    ...typography.body,
    color: colors.text,
  },
  friendActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emptyFriends: {
    ...typography.caption,
    color: colors.textMuted,
  },
  link: {
    ...typography.label,
    color: colors.text,
  },
  linkMuted: {
    ...typography.label,
    color: colors.textMuted,
  },
  secondaryAction: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  secondaryActionLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  saveButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: 'center',
  },
  saveDisabled: { opacity: 0.4 },
  saveLabel: {
    ...typography.label,
    color: colors.background,
  },
  signOut: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  signOutLabel: {
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
