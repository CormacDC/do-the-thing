export const colors = {
  background: '#F7F7F5',
  text: '#1A1A1A',
  textMuted: '#6B6B6B',
  border: '#E8E8E6',
  priority: '#8B4513',
  priorityMuted: '#8B451320',
  complete: '#9A9A96',
  inputBackground: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
} as const;
