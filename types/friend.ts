import type { Tables } from '@/types/database';

export type FriendshipRow = Tables<'friendships'>;
export type AccountabilityTargetRow = Tables<'accountability_targets'>;

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
};

/** Friend as shown in the UI (other party + relationship metadata). */
export type FriendListItem = {
  friendshipId: string;
  friendUserId: string;
  displayName: string;
  friendCode: string | null;
  status: FriendshipStatus;
  /** True when the current user is the addressee of a pending request. */
  canRespond: boolean;
  isNotifyTarget: boolean;
};

export type FriendLookupResult = {
  id: string;
  displayName: string;
};
