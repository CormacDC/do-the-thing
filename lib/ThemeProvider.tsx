import { createContext, type ReactNode } from 'react';

import { theme, type Theme } from '@/lib/theme';

export const ThemeContext = createContext<Theme | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
