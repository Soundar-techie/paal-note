export const Colors = {
  // Brand colors
  primary: '#059669', // Emerald 600
  primaryDark: '#047857', // Emerald 700
  primaryLight: '#D1FAE5', // Emerald 100
  primaryUltraLight: '#ECFDF5', // Emerald 50

  secondary: '#0284C7', // Sky 600
  secondaryLight: '#E0F2FE', // Sky 100

  accent: '#D97706', // Amber 600
  accentLight: '#FEF3C7', // Amber 100

  // Session Colors
  morning: '#F59E0B', // Amber / Sun
  morningLight: '#FFFBEB',
  evening: '#6366F1', // Indigo / Dusk
  eveningLight: '#EEF2FF',

  // Status colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutrals
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
  black: '#000000',

  // UI Surfaces
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 24, fontWeight: '700', color: Colors.slate900 },
  h2: { fontSize: 20, fontWeight: '700', color: Colors.slate900 },
  h3: { fontSize: 16, fontWeight: '600', color: Colors.slate900 },
  body: { fontSize: 14, fontWeight: '400', color: Colors.slate700 },
  bodyMedium: { fontSize: 14, fontWeight: '500', color: Colors.slate800 },
  caption: { fontSize: 12, fontWeight: '400', color: Colors.slate500 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.slate600, textTransform: 'uppercase', letterSpacing: 0.5 },
};

export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
};
