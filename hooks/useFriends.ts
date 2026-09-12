import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAccountabilityTargets } from '@/hooks/useAccountabilityTargets';
import { isValidFriendCode, normalizeFriendCode } from '@/lib/friendCode';
import { supabase } from '@/lib/supabase';
import type { FriendListItem, FriendshipStatus } from '@/types/friend';

export type UseFriendsResult = {
  friends: FriendListItem[];
  targetCount: number;
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  dismissMutationError: () => void;
  requestFriend: (friendCode: string) => Promise<boolean>;
  respondToFriend: (friendshipId: string, accept: boolean) => Promise<boolean>;
  setNotifyTarget: (partnerId: string, enabled: boolean) => Promise<boolean>;
  reload: () => void;
};

type FriendshipQueryRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
};

type ProfileSnippet = {
  id: string;
  display_name: string;
  friend_code: string;
};

function mapFriends(
  userId: string,
  friendships: FriendshipQueryRow[],
  targetIds: string[],
  profiles: ProfileSnippet[],
): FriendListItem[] {
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const targetSet = new Set(targetIds);

  return friendships.map((row) => {
    const friendUserId =
      row.requester_id === userId ? row.addressee_id : row.requester_id;
    const profile = profileById.get(friendUserId);

    return {
      friendshipId: row.id,
      friendUserId,
      displayName: profile?.display_name ?? 'Friend',
      friendCode: profile?.friend_code ?? null,
      status: row.status as FriendshipStatus,
      canRespond: row.status === 'pending' && row.addressee_id === userId,
      isNotifyTarget: targetSet.has(friendUserId),
    };
  });
}

export function useFriends(userId: string | null): UseFriendsResult {
  const targets = useAccountabilityTargets(userId);
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!supabase || !userId) {
      setFriends([]);
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

        const friendshipsRes = await client
          .from('friendships')
          .select('id, requester_id, addressee_id, status')
          .or(`requester_id.eq.${ownerId},addressee_id.eq.${ownerId}`)
          .in('status', ['pending', 'accepted']);

        if (cancelled) return;
        if (friendshipsRes.error) throw friendshipsRes.error;

        const friendshipRows = (friendshipsRes.data ?? []) as FriendshipQueryRow[];

        const otherIds = Array.from(
          new Set(
            friendshipRows.map((row) =>
              row.requester_id === ownerId ? row.addressee_id : row.requester_id,
            ),
          ),
        );

        let profiles: ProfileSnippet[] = [];
        if (otherIds.length > 0) {
          const { data: profileData, error: profileError } = await client.rpc(
            'lookup_friend_profiles',
            { p_ids: otherIds },
          );

          if (profileError) {
            if (__DEV__) console.warn('[Do The Thing] friend profiles:', profileError);
            profiles = otherIds.map((id) => ({
              id,
              display_name: 'Friend',
              friend_code: '',
            }));
          } else {
            profiles = (profileData as ProfileSnippet[] | null) ?? [];
          }
        }

        if (cancelled) return;
        setFriends(mapFriends(ownerId, friendshipRows, targets.partnerIds, profiles));
      } catch (err) {
        if (cancelled) return;
        if (__DEV__) console.warn('[Do The Thing] load friends failed:', err);
        setError("We couldn't load your friends. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey, targets.partnerIds]);

  const requestFriend = useCallback(
    async (friendCode: string): Promise<boolean> => {
      if (!supabase || !userId) return false;
      setMutationError(null);

      const normalized = normalizeFriendCode(friendCode);
      if (!isValidFriendCode(normalized)) {
        setMutationError('Enter a valid 6-character friend code.');
        return false;
      }

      try {
        const { error: rpcError } = await supabase.rpc('request_friendship', {
          p_friend_code: normalized,
        });
        if (rpcError) throw rpcError;
        setReloadKey((k) => k + 1);
        return true;
      } catch (err) {
        if (__DEV__) console.warn('[Do The Thing] request friendship failed:', err);
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : "We couldn't send that friend request.";
        setMutationError(message);
        return false;
      }
    },
    [userId],
  );

  const respondToFriend = useCallback(
    async (friendshipId: string, accept: boolean): Promise<boolean> => {
      if (!supabase || !userId) return false;
      setMutationError(null);

      try {
        const { error: rpcError } = await supabase.rpc('respond_to_friendship', {
          p_id: friendshipId,
          p_accept: accept,
        });
        if (rpcError) throw rpcError;
        setReloadKey((k) => k + 1);
        return true;
      } catch (err) {
        if (__DEV__) console.warn('[Do The Thing] respond friendship failed:', err);
        setMutationError("We couldn't update that friend request.");
        return false;
      }
    },
    [userId],
  );

  const setNotifyTarget = useCallback(
    async (partnerId: string, enabled: boolean): Promise<boolean> => {
      const ok = await targets.setNotifyTarget(partnerId, enabled);
      if (ok) setReloadKey((k) => k + 1);
      return ok;
    },
    [targets],
  );

  const dismissMutationError = useCallback(() => {
    setMutationError(null);
    targets.dismissMutationError();
  }, [targets]);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
    targets.reload();
  }, [targets]);

  return useMemo(
    () => ({
      friends,
      targetCount: targets.targetCount,
      loading: loading || targets.loading,
      error: error ?? targets.error,
      mutationError: mutationError ?? targets.mutationError,
      dismissMutationError,
      requestFriend,
      respondToFriend,
      setNotifyTarget,
      reload,
    }),
    [
      friends,
      targets.targetCount,
      targets.loading,
      targets.error,
      targets.mutationError,
      loading,
      error,
      mutationError,
      dismissMutationError,
      requestFriend,
      respondToFriend,
      setNotifyTarget,
      reload,
    ],
  );
}
