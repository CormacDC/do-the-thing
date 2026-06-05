import type { ReactNode } from 'react';

import { AppStateContext, useAppStateController } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';

type AppStateProviderProps = {
  children: ReactNode;
};

export function AppStateProvider({ children }: AppStateProviderProps) {
  const { userId } = useAuth();
  const value = useAppStateController(userId);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
