import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';
import type { Profile, ProfileInsert, ProfileSettingsUpdate } from '@/types/profile';

type ProfileRow = Tables<'profiles'>;

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    friendCode: row.friend_code,
    customSms: row.custom_sms,
    onboardingComplete: row.onboarding_complete,
  };
}

export type ProfileValue = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  dismissMutationError: () => void;
  createProfile: (input: ProfileInsert) => Promise<boolean>;
  updateProfileSettings: (input: ProfileSettingsUpdate) => Promise<boolean>;
  completeOnboarding: (customSms?: string | null) => Promise<boolean>;
  retry: () => void;
};

export const ProfileContext = createContext<ProfileValue | null>(null);

export function useProfileController(userId: string | null): ProfileValue {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const client = supabase;
    const ownerId = userId;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await client
          .from('profiles')
          .select('*')
          .eq('id', ownerId)
          .maybeSingle();

        if (cancelled) return;
        if (queryError) throw queryError;

        setProfile(data ? fromRow(data) : null);
      } catch (err) {
        if (cancelled) return;
        if (__DEV__) console.warn('[Do The Thing] load profile failed');
        setError("We couldn't load your profile. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const createProfile = useCallback(
    async (input: ProfileInsert): Promise<boolean> => {
      if (!supabase || !userId) return false;

      setMutationError(null);

      try {
        if (profile && !profile.onboardingComplete) {
          const { data, error: updateError } = await supabase
            .from('profiles')
            .update({
              display_name: input.displayName.trim(),
              custom_sms: input.customSms?.trim() || null,
            })
            .eq('id', userId)
            .select('*')
            .single();
          if (updateError) throw updateError;
          setProfile(fromRow(data));
          return true;
        }

        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            display_name: input.displayName.trim(),
            custom_sms: input.customSms?.trim() || null,
            onboarding_complete: false,
          })
          .select('*')
          .single();

        if (insertError) throw insertError;

        setProfile(fromRow(data));
        return true;
      } catch (err) {
        if (__DEV__) console.warn('[Do The Thing] create profile failed');
        setMutationError("We couldn't save your profile. Try again.");
        return false;
      }
    },
    [profile, userId],
  );

  const updateProfileSettings = useCallback(
    async (input: ProfileSettingsUpdate): Promise<boolean> => {
      if (!supabase || !userId || !profile) return false;

      setMutationError(null);

      try {
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({
            custom_sms: input.customSms?.trim() || null,
          })
          .eq('id', userId)
          .select('*')
          .single();

        if (updateError) throw updateError;

        setProfile(fromRow(data));
        return true;
      } catch (err) {
        if (__DEV__) console.warn('[Do The Thing] update profile failed');
        setMutationError("We couldn't update your settings. Try again.");
        return false;
      }
    },
    [profile, userId],
  );

  const completeOnboarding = useCallback(
    async (customSms?: string | null): Promise<boolean> => {
      if (!supabase || !userId) return false;

      setMutationError(null);

      try {
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({
            onboarding_complete: true,
            ...(customSms !== undefined
              ? { custom_sms: customSms?.trim() || null }
              : {}),
          })
          .eq('id', userId)
          .select('*')
          .single();

        if (updateError) throw updateError;

        setProfile(fromRow(data));
        return true;
      } catch (err) {
        if (__DEV__) console.warn('[Do The Thing] complete onboarding failed');
        setMutationError("We couldn't finish onboarding. Try again.");
        return false;
      }
    },
    [userId],
  );

  const dismissMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const retry = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return {
    profile,
    loading,
    error,
    mutationError,
    dismissMutationError,
    createProfile,
    updateProfileSettings,
    completeOnboarding,
    retry,
  };
}

export function useProfile(): ProfileValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used inside a <ProfileProvider>.');
  }
  return ctx;
}
