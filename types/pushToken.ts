import type { Tables } from '@/types/database';

export type PushTokenRow = Tables<'push_tokens'>;

export type PushToken = {
  id: string;
  userId: string;
  expoPushToken: string;
  platform: string;
  updatedAt: string;
};
