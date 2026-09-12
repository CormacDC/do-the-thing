import type { Tables } from '@/types/database';

export type ProfileRow = Tables<'profiles'>;

/** Client-side, camelCased view of a profile record. */
export type Profile = {
  id: string;
  displayName: string;
  friendCode: string;
  customSms: string | null;
  onboardingComplete: boolean;
};

export type ProfileInsert = {
  displayName: string;
  customSms?: string | null;
};

export type ProfileSettingsUpdate = {
  customSms: string | null;
};
