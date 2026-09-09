// Design tokens & theme for the mobile app

export const Colors = {
  // Primary palette
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  primaryLight: '#8B85FF',
  primaryFaded: 'rgba(108, 99, 255, 0.12)',

  // Accent
  accent: '#FF6B9D',
  accentDark: '#E0548A',
  accentLight: '#FF8FB8',

  // Background
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  surfaceElevated: '#2D2D4A',
  card: '#1E1E35',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#6B6B8D',
  textInverse: '#0F0F1A',

  // Status
  success: '#4ADE80',
  successDark: '#22C55E',
  warning: '#FBBF24',
  warningDark: '#F59E0B',
  error: '#F87171',
  errorDark: '#EF4444',
  info: '#60A5FA',

  // Misc
  border: '#2A2A45',
  borderLight: '#3A3A5C',
  overlay: 'rgba(0, 0, 0, 0.65)',
  shimmer: '#2A2A45',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gradient stops
  gradientStart: '#6C63FF',
  gradientEnd: '#FF6B9D',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  hero: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};
