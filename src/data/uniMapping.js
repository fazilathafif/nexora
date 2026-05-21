// University → required admissions tests mapping
// Edit this file to add/remove universities, courses, or tests.
// "conditional" means the test is required only if an offer is received (post-application).

export const UNI_MAPPING = [
  // ── Cambridge ────────────────────────────────────────────────────────────────
  {
    university: 'Cambridge',
    course: 'Mathematics',
    tests: [
      { id: 'step', label: 'STEP 2 & 3', conditional: true, note: 'Conditional on offer — taken June after A Levels' },
    ],
  },
  {
    university: 'Cambridge',
    course: 'Natural Sciences',
    tests: [
      { id: 'tmua', label: 'TMUA', conditional: false },
    ],
  },
  {
    university: 'Cambridge',
    course: 'Engineering',
    tests: [
      { id: 'esat', label: 'ESAT', conditional: false },
    ],
  },
  {
    university: 'Cambridge',
    course: 'Medicine',
    tests: [
      { id: 'ucat', label: 'UCAT', conditional: false },
    ],
  },

  // ── Oxford ───────────────────────────────────────────────────────────────────
  {
    university: 'Oxford',
    course: 'Mathematics',
    tests: [
      { id: 'mat', label: 'MAT', conditional: false },
    ],
  },
  {
    university: 'Oxford',
    course: 'Physics',
    tests: [
      { id: 'pat', label: 'PAT', conditional: false },
    ],
  },
  {
    university: 'Oxford',
    course: 'Engineering Science',
    tests: [
      { id: 'pat', label: 'PAT', conditional: false },
    ],
  },
  {
    university: 'Oxford',
    course: 'PPE',
    tests: [
      { id: 'tara', label: 'TARA', conditional: false },
    ],
  },
  {
    university: 'Oxford',
    course: 'Law',
    tests: [
      { id: 'lnat', label: 'LNAT', conditional: false },
    ],
  },
  {
    university: 'Oxford',
    course: 'Medicine',
    tests: [
      { id: 'ucat', label: 'UCAT', conditional: false },
    ],
  },

  // ── Imperial ─────────────────────────────────────────────────────────────────
  {
    university: 'Imperial',
    course: 'Mathematics',
    tests: [
      { id: 'mat', label: 'MAT', conditional: false },
    ],
  },
  {
    university: 'Imperial',
    course: 'Engineering',
    tests: [
      { id: 'esat', label: 'ESAT', conditional: false },
    ],
  },

  // ── UCL ──────────────────────────────────────────────────────────────────────
  {
    university: 'UCL',
    course: 'PPE',
    tests: [
      { id: 'tara', label: 'TARA', conditional: false },
    ],
  },
  {
    university: 'UCL',
    course: 'Philosophy',
    tests: [
      { id: 'tara', label: 'TARA', conditional: false },
    ],
  },

  // ── Warwick ──────────────────────────────────────────────────────────────────
  {
    university: 'Warwick',
    course: 'Mathematics',
    tests: [
      { id: 'tmua', label: 'TMUA', conditional: false },
    ],
  },

  // ── Bath ─────────────────────────────────────────────────────────────────────
  {
    university: 'Bath',
    course: 'Mathematics',
    tests: [
      { id: 'tmua', label: 'TMUA', conditional: false },
    ],
  },

  // ── Edinburgh ────────────────────────────────────────────────────────────────
  {
    university: 'Edinburgh',
    course: 'Medicine',
    tests: [
      { id: 'ucat', label: 'UCAT', conditional: false },
    ],
  },

  // ── King's College London ────────────────────────────────────────────────────
  {
    university: "King's College London",
    course: 'Medicine',
    tests: [
      { id: 'ucat', label: 'UCAT', conditional: false },
    ],
  },
]

// Unique list of universities (for picker)
export const UNIVERSITIES = [...new Set(UNI_MAPPING.map(e => e.university))]

// Get courses for a given university
export function getCoursesForUni(university) {
  return UNI_MAPPING.filter(e => e.university === university).map(e => e.course)
}

// Get required tests for a given university + course
export function getTestsForCourse(university, course) {
  const entry = UNI_MAPPING.find(e => e.university === university && e.course === course)
  return entry ? entry.tests : []
}
