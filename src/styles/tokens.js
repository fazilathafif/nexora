// Design tokens — single source of truth for spacing, typography, shadows, radii.
// Import NAV_HEIGHT wherever bottom-nav clearance is needed.

export const NAV_HEIGHT = 64   // px — fixed bottom nav height

export const sp = {
  s0: 4,
  s1: 8,
  s2: 12,
  s3: 16,
  s4: 20,
  s5: 24,
  s6: 32,
  s7: 48,
}

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
}

export const shadow = {
  sm: '0 1px 4px rgba(0,0,0,0.07)',
  md: '0 4px 14px rgba(0,0,0,0.10)',
  lg: '0 8px 28px rgba(0,0,0,0.14)',
}

export const fontSize = {
  xs:  11,
  sm:  13,
  md:  15,
  lg:  17,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
}
