import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router, Redirect, type Href } from 'expo-router';
import {
  Bell,
  Check,
  ChevronLeft,
  LogOut,
  MessageSquare,
  RefreshCw,
  Send,
  UserPlus,
  X,
} from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { Banner } from '@/components/ui/Banner';
import {
  IconButton,
  PrimaryButton,
  SecondaryButton,
  TextButton,
} from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FriendCodeCard } from '@/components/ui/FriendCodeCard';
import { FriendRow } from '@/components/ui/FriendRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Surface } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useProfile } from '@/hooks/useProfile';
import { usePushToken } from '@/hooks/usePushToken';
import { useTheme } from '@/hooks/useTheme';
import {
  ACCOUNTABILITY_COPY,
  ACCOUNTABILITY_TOKEN_HINT,
} from '@/lib/accountabilityCopy';
import { replaceAccountabilityTokens } from '@/lib/accountabilityMessage';
import type { Theme } from '@/lib/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
          <ActivityIndicator color={theme.colors.textSecondary} />
        </View>
      </Screen>
    );
  }

  if (error && !profile) {
    return (
      <Screen>
        <EmptyState
          title="Couldn't load settings"
          body={error}
          action={<SecondaryButton label="Try again" onPress={retry} />}
        />
      </Screen>
    );
  }

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const pendingFriends = friends.filter((f) => f.status === 'pending');

  const friendsCaption =
    'At least one accepted friend must be marked to receive the midnight push.' +
    (targetCount === 0
      ? ' None selected yet — you cannot set a quota until you pick someone.'
      : ` ${targetCount} selected.`);

  const pushSubtitle =
    push.permissionGranted === true
      ? 'Permission granted — this device can receive accountability pushes.'
      : push.permissionGranted === false
        ? push.error ??
          'Notifications are off. Enable them so friends’ misses can reach you.'
        : 'Checking notification permission…';

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
            <IconButton
              icon={ChevronLeft}
              accessibilityLabel="Go back"
              onPress={() => router.back()}
            />
            <Text style={styles.title}>Settings</Text>
          </View>

          <View>
            <SectionHeader title="Your friend code" />
            <FriendCodeCard code={profile?.friendCode ?? '—'} />
          </View>

          <View>
            <SectionHeader title="Friends" caption={friendsCaption} />
            <Surface padded={false}>
              <View style={styles.paddedBlock}>
                <TextField
                  icon={UserPlus}
                  placeholder="Friend code"
                  value={friendCodeInput}
                  onChangeText={setFriendCodeInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                />
                <SecondaryButton
                  label="Send request"
                  icon={Send}
                  onPress={() => {
                    void handleAddFriend();
                  }}
                />
              </View>

              {pendingFriends.map((friend, index) => (
                <FriendRow
                  key={friend.friendshipId}
                  displayName={friend.displayName}
                  subtitle={
                    friend.canRespond ? 'Wants to be friends' : 'Request sent'
                  }
                  showSeparator
                  trailing={
                    friend.canRespond ? (
                      <View style={styles.friendActions}>
                        <TextButton
                          label="Accept"
                          icon={Check}
                          onPress={() => {
                            void respondToFriend(friend.friendshipId, true);
                          }}
                        />
                        <TextButton
                          label="Decline"
                          icon={X}
                          onPress={() => {
                            void respondToFriend(friend.friendshipId, false);
                          }}
                        />
                      </View>
                    ) : null
                  }
                />
              ))}

              {friendsLoading ? (
                <View style={styles.paddedBlock}>
                  <ActivityIndicator color={theme.colors.textSecondary} />
                </View>
              ) : acceptedFriends.length === 0 ? (
                <View style={styles.paddedBlock}>
                  <Text style={styles.caption}>No accepted friends yet.</Text>
                </View>
              ) : (
                acceptedFriends.map((friend, index) => (
                  <FriendRow
                    key={friend.friendshipId}
                    displayName={friend.displayName}
                    subtitle={friend.friendCode ?? undefined}
                    showSeparator={index < acceptedFriends.length - 1}
                    trailing={
                      <Switch
                        value={friend.isNotifyTarget}
                        onValueChange={(enabled) => {
                          void setNotifyTarget(friend.friendUserId, enabled);
                        }}
                        trackColor={{
                          false: theme.colors.border,
                          true: theme.colors.accent,
                        }}
                        thumbColor={theme.colors.switchThumb}
                      />
                    }
                  />
                ))
              )}

              <View style={styles.paddedBlock}>
                <TextButton
                  label="Refresh friends"
                  icon={RefreshCw}
                  onPress={reloadFriends}
                />
              </View>
            </Surface>
          </View>

          <View>
            <SectionHeader title="Notifications" />
            <Surface padded={false}>
              <SettingsRow
                icon={Bell}
                title="Push notifications"
                subtitle={pushSubtitle}
                showSeparator
              />
              <View style={styles.paddedBlock}>
                <SecondaryButton
                  label={push.loading ? 'Updating…' : 'Refresh'}
                  loading={push.loading}
                  onPress={() => {
                    void push.refresh();
                  }}
                />
              </View>
            </Surface>
          </View>

          <View>
            <SectionHeader title="Message" caption={ACCOUNTABILITY_TOKEN_HINT} />
            <Surface>
              <Text style={styles.preview}>
                {replaceAccountabilityTokens(ACCOUNTABILITY_COPY.fullMiss, {
                  name: profile?.displayName ?? 'Alex',
                  completed: 0,
                  quota: 3,
                })}
              </Text>
              <TextField
                icon={MessageSquare}
                placeholder="Custom message (optional)"
                value={customSms}
                onChangeText={setCustomSms}
                multiline
                autoCorrect={false}
              />
            </Surface>
          </View>

          {errorMessage ? (
            <Banner
              tone="error"
              body={errorMessage}
              onPress={() => {
                setValidationError(null);
                dismissMutationError();
                dismissFriendsError();
              }}
            />
          ) : null}

          <PrimaryButton
            label={saving ? 'Saving…' : 'Save'}
            loading={saving}
            onPress={() => {
              void handleSave();
            }}
          />

          <TextButton
            label={signingOut ? 'Signing out…' : 'Sign out'}
            icon={LogOut}
            tone="danger"
            disabled={signingOut}
            onPress={() => {
              void handleSignOut();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingBottom: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    paddedBlock: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    friendActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    caption: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    preview: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
  });
}
