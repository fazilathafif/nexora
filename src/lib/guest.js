// Shared localStorage helpers for guest (offline) mode.
// Kept in a separate file to break the db.js ↔ useAuth.js circular dependency.

const GUEST_KEY = 'bp_guest_profile'

export function loadGuestProfile() {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY)) ?? null } catch { return null }
}

export function saveGuestProfile(p) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(p))
}

export function defaultGuestProfile() {
  return { id: 'guest_local', xp: 0, streak: 0, stream: null, last_active_date: null, display_name: 'Student' }
}
