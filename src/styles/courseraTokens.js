export const COURSERA_BLUE       = '#0056D2'
export const COURSERA_BLUE_DARK  = '#4A90E2'
export const COURSERA_BLUE_LIGHT = '#E8F0FD'

export const TRACK_COLORS = {
  gcse:   '#0056D2',
  alevel: '#6D28D9',
  sat:    '#0F766E',
  act:    '#B45309',
  ap:     '#BE185D',
  psat:   '#1D4ED8',
  igcse: '#0D9488',
  ib:    '#5B21B6',
}

export function getTheme(stream, isDark = false) {
  const trackAccent = TRACK_COLORS[stream] ?? COURSERA_BLUE
  return {
    primary:     COURSERA_BLUE,
    card:        isDark ? '#2D2F31' : '#FFFFFF',
    bg:          isDark ? '#1C1D1F' : '#F5F7FA',
    navy:        isDark ? '#F2F2F2' : '#1F1F1F',
    muted:       isDark ? '#9CA3AF' : '#6B7280',
    border:      isDark ? '#374151' : '#E5E7EB',
    success:     '#008060',
    successBg:   isDark ? '#063D2E' : '#E6F4F0',
    error:       '#C0152F',
    errorBg:     isDark ? '#3F0A10' : '#FDEAEC',
    warning:     '#E6700A',
    warningBg:   isDark ? '#3D2106' : '#FEF3E7',
    blueTint:    isDark ? '#1E3A5F' : '#E8F0FD',
    trackAccent,
    // Legacy compat — components reference these fields
    secondary:   trackAccent,
    accent:      isDark ? '#1E3A5F' : '#E8F0FD',
    soft:        isDark ? '#1E3A5F' : '#E8F0FD',
  }
}
