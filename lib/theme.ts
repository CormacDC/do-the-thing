import type { TextStyle } from 'react-native';

const tabularNums: NonNullable<TextStyle['fontVariant']> = ['tabular-nums'];

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnAccent: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentMuted: string;
  accentPressed: string;
  priority: string;
  priorityMuted: string;
  warning: string;
  warningMuted: string;
  error: string;
  errorMuted: string;
  overlay: string;
  switchThumb: string;
};

const light = {
  background: '#F3F6F1',
  surface: '#FFFFFF',
  surfaceMuted: '#E7EEE4',
  textPrimary: '#1A2317',
  textSecondary: '#5E6B5A',
  textTertiary: '#8A9586',
  textOnAccent: '#FFFFFF',
  border: '#D4DDD0',
  borderStrong: '#B7C4B3',
  accent: '#3D8B63',
  accentMuted: '#D7EBDD',
  accentPressed: '#327352',
  priority: '#C4A35A',
  priorityMuted: '#F3EAD4',
  warning: '#C45C3E',
  warningMuted: '#F6E4DE',
  error: '#B42318',
  errorMuted: '#F8E6E4',
  overlay: '#1A231799',
  switchThumb: '#FFFFFF',
} as const satisfies ColorTokens;

export const palettes = { light } as const satisfies { light: ColorTokens };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  display: {
    fontSize: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    fontVariant: tabularNums,
  },
  numeric: {
    fontSize: 56,
    fontWeight: '700' as const,
    fontVariant: tabularNums,
  },
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.6,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  overline: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const iconStroke = 1.75;

export type Theme = {
  colors: ColorTokens;
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  iconSize: typeof iconSize;
  iconStroke: number;
};

export const theme: Theme = {
  colors: palettes.light,
  spacing,
  typography,
  radius,
  iconSize,
  iconStroke,
};
