import { useContext } from 'react';

import { ThemeContext } from '@/lib/ThemeProvider';
import type { Theme } from '@/lib/theme';

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside a <ThemeProvider>.');
  }
  return ctx;
}
