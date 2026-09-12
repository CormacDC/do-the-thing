import { usePushToken } from '@/hooks/usePushToken';
import { useAuth } from '@/hooks/useAuth';

/** Registers Expo push tokens for the signed-in user; renders nothing. */
export function PushTokenRegistrar() {
  const { userId } = useAuth();
  usePushToken(userId);
  return null;
}
