// Design tokens — single source of truth for spacing, typography, shadows, radii.
// Import NAV_HEIGHT wherever bottom-nav clearance is needed.

export const NAV_HEIGHT = 80   // px — clearance for floating bottom nav (bar 62px + 10px gap)

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

// Coursera-aligned radius scale (smaller, cleaner)
export const radius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 999,
}

export const shadow = {
  sm:     '0 1px 4px rgba(0,0,0,0.07)',
  md:     '0 4px 14px rgba(0,0,0,0.10)',
  lg:     '0 8px 28px rgba(0,0,0,0.14)',
  smDark: '0 1px 4px rgba(0,0,0,0.25)',
  mdDark: '0 4px 16px rgba(0,0,0,0.35)',
  lgDark: '0 8px 32px rgba(0,0,0,0.50)',
  // Coursera elevation levels
  card:     '0 2px 8px rgba(0,0,0,0.08)',
  cardDark: '0 2px 8px rgba(0,0,0,0.32)',
  modal:    '0 12px 40px rgba(0,0,0,0.18)',
  fab:      '0 4px 16px rgba(0,0,0,0.22)',
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

export const SERIF = "'Playfair Display', Georgia, serif"
