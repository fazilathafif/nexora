export const NOTES_KEY = 'nx_notes'
export const NOTES_MAX = 10

export function getNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) ?? '[]') } catch { return [] }
}

export function saveNote({ subject, topic, question, explanation, stream }) {
  const notes = getNotes()
  if (notes.length >= NOTES_MAX) return false
  notes.unshift({ id: Date.now(), subject, topic, question, explanation, stream, savedAt: new Date().toISOString() })
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  return true
}

export function deleteNote(id) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(getNotes().filter(n => n.id !== id)))
}

export function exportNotesText(notes) {
  if (!notes.length) return ''
  return notes.map((n, i) => [
    `── Note ${i + 1} ──────────────────────────────────────────────────`,
    `Subject: ${n.subject ? n.subject.charAt(0).toUpperCase() + n.subject.slice(1) : 'Unknown'}  ·  Topic: ${n.topic || 'Unknown'}`,
    `Saved: ${new Date(n.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    '',
    `Q: ${n.question}`,
    '',
    n.explanation,
  ].join('\n')).join('\n\n')
}
