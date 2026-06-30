import type { ReactNode } from 'react';

import { ProfileContext, useProfileController } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const { userId } = useAuth();
  const value = useProfileController(userId);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
