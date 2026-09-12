import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type PushRegistrationResult =
  | { ok: true; token: string }
  | { ok: false; reason: string };

/**
 * Request notification permission and return an Expo push token when available.
 * Safe to call repeatedly; never throws to callers.
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  try {
    if (!Device.isDevice) {
      return { ok: false, reason: 'Push notifications require a physical device.' };
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { ok: false, reason: 'Notification permission was not granted.' };
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('accountability', {
        name: 'Accountability',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;

    if (!token) {
      return { ok: false, reason: 'No Expo push token returned.' };
    }

    return { ok: true, token };
  } catch (err) {
    if (__DEV__) console.warn('[Do The Thing] push registration failed:', err);
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'Push registration failed.',
    };
  }
}

/** Upsert the current device token for the signed-in user. */
export async function savePushToken(userId: string, token: string): Promise<boolean> {
  if (!supabase) return false;

  const platform =
    Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web'
      ? Platform.OS
      : 'unknown';

  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' },
  );

  if (error) {
    if (__DEV__) console.warn('[Do The Thing] save push token failed:', error);
    return false;
  }

  return true;
}
