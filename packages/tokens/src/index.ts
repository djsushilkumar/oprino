export const colors = {
  brand: {
    navy: '#0F172A',
    cobalt: '#164CFF',
    ocean: '#087DE5',
    mint: '#20BAAA',
    deepBlue: '#1235A4',
  },
  neutral: {
    paper: '#F8FAFC',
    border: '#DDE5EF',
    slate: '#475569',
    white: '#FFFFFF',
    black: '#000000',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#087DE5',
  },
} as const;

export const typography = {
  fontFamily: {
    display: 'Outfit, system-ui, -apple-system, sans-serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const radii = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

export const tokens = {
  color: colors,
  typography,
  spacing,
  radii,
} as const;

export type Tokens = typeof tokens;
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
