/**
 * Grade mapping utilities for IGCSE and IB Diploma.
 */

/** Map percentage score to IGCSE grade (9-1 scheme) */
export function getIGCSEGrade91(pct) {
  if (pct >= 90) return '9'
  if (pct >= 80) return '8'
  if (pct >= 70) return '7'
  if (pct >= 60) return '6'
  if (pct >= 55) return '5'
  if (pct >= 45) return '4'
  if (pct >= 35) return '3'
  if (pct >= 25) return '2'
  return '1'
}

/** Map percentage score to IGCSE grade (A*-G scheme) */
export function getIGCSEGradeAG(pct) {
  if (pct >= 90) return 'A*'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  if (pct >= 40) return 'E'
  if (pct >= 30) return 'F'
  return 'G'
}

/** Map percentage to IGCSE grade using selected scheme ('9-1' | 'A*-G') */
export function getIGCSEGrade(pct, scheme) {
  return scheme === 'A*-G' ? getIGCSEGradeAG(pct) : getIGCSEGrade91(pct)
}

/** Map percentage accuracy to IB grade (1-7) */
export function getIBGrade(pct) {
  if (pct >= 85) return 7
  if (pct >= 75) return 6
  if (pct >= 65) return 5
  if (pct >= 55) return 4
  if (pct >= 45) return 3
  if (pct >= 30) return 2
  return 1
}

/** Get IB grade colour */
export function getIBGradeColor(grade) {
  if (grade >= 6) return '#10B981'
  if (grade >= 4) return '#F59E0B'
  return '#EF4444'
}

/**
 * Compute projected IB total from an object of { subjectId: accuracy% }.
 * Returns { total, breakdown: [{subjectId, grade}], bonusPoints }
 * Max total = 45 (6 subjects × 7 + 3 bonus from ToK/EE)
 */
export function getIBTotal(accuracyMap, ibSubjects) {
  const subjectIds = ibSubjects
    .filter(s => s.id !== 'ib_tok')
    .map(s => s.id)

  let total = 0
  const breakdown = []

  for (const id of subjectIds) {
    const pct   = accuracyMap[id] ?? null
    const grade = pct !== null ? getIBGrade(pct) : null
    breakdown.push({ subjectId: id, grade, pct })
    if (grade !== null) total += grade
  }

  const tokPct    = accuracyMap['ib_tok'] ?? null
  const bonusPoints = tokPct !== null ? (tokPct >= 75 ? 3 : tokPct >= 55 ? 2 : 1) : 0
  total += bonusPoints

  return { total: Math.min(total, 45), breakdown, bonusPoints }
}
