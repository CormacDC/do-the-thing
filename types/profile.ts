import type { Tables } from '@/types/database';

export type ProfileRow = Tables<'profiles'>;

/** Client-side, camelCased view of a profile record. */
export type Profile = {
  id: string;
  displayName: string;
  partnerName: string;
  partnerPhone: string;
  customSms: string | null;
};

export type ProfileInsert = {
  displayName: string;
  partnerName: string;
  partnerPhone: string;
  customSms?: string | null;
};

export type ProfileSettingsUpdate = {
  partnerName: string;
  partnerPhone: string;
  customSms: string | null;
};
