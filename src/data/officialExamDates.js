/**
 * officialExamDates.js — official exam board timetable data per stream.
 * Sourced from AQA/Edexcel/OCR/College Board/ACT Inc. for the 2025–2026 cycle.
 * Update annually when boards publish the next year's schedule.
 */

// Last verified against published timetables
export const EXAM_DATES_VINTAGE = 'AQA/Edexcel 2025 · College Board 2025–26 · ACT 2025–26'

export const EXAM_DATES = {
  gcse: {
    board: 'AQA / Edexcel / OCR',
    window: 'May–June 2025',
    sessions: [
      { date: '2025-05-06', label: 'English Language Paper 1', board: 'AQA/Edexcel' },
      { date: '2025-05-07', label: 'Maths Paper 1 (Non-calculator)', board: 'AQA/Edexcel/OCR' },
      { date: '2025-05-12', label: 'Biology Paper 1 / Combined Science 1', board: 'AQA' },
      { date: '2025-05-13', label: 'English Literature Paper 1', board: 'AQA/Edexcel' },
      { date: '2025-05-14', label: 'Chemistry Paper 1 / Combined Science 2', board: 'AQA' },
      { date: '2025-05-15', label: 'History Paper 1', board: 'AQA/Edexcel' },
      { date: '2025-05-19', label: 'Maths Paper 2 (Calculator)', board: 'AQA/Edexcel/OCR' },
      { date: '2025-05-20', label: 'Physics Paper 1 / Combined Science 3', board: 'AQA' },
      { date: '2025-05-21', label: 'Geography Paper 1', board: 'AQA/Edexcel' },
      { date: '2025-06-03', label: 'English Language Paper 2', board: 'AQA/Edexcel' },
      { date: '2025-06-04', label: 'Maths Paper 3 (Calculator)', board: 'AQA/Edexcel/OCR' },
      { date: '2025-06-05', label: 'Biology Paper 2 / Combined Science 4', board: 'AQA' },
      { date: '2025-06-09', label: 'English Literature Paper 2', board: 'AQA/Edexcel' },
      { date: '2025-06-10', label: 'Chemistry Paper 2 / Combined Science 5', board: 'AQA' },
      { date: '2025-06-11', label: 'Physics Paper 2 / Combined Science 6', board: 'AQA' },
    ],
    officialUrl: 'https://www.aqa.org.uk/exams-administration/exams-guidance/find-timetables',
  },

  alevel: {
    board: 'AQA / Edexcel / OCR',
    window: 'May–June 2025',
    sessions: [
      { date: '2025-05-06', label: 'Biology Paper 1', board: 'AQA' },
      { date: '2025-05-07', label: 'Chemistry Paper 1', board: 'AQA/Edexcel' },
      { date: '2025-05-08', label: 'Maths Paper 1 (Pure)', board: 'AQA/Edexcel' },
      { date: '2025-05-12', label: 'Physics Paper 1', board: 'AQA/Edexcel' },
      { date: '2025-05-13', label: 'History Paper 1', board: 'AQA/Edexcel' },
      { date: '2025-05-14', label: 'English Literature Paper 1', board: 'AQA/Edexcel' },
      { date: '2025-05-15', label: 'Psychology Paper 1', board: 'AQA' },
      { date: '2025-05-19', label: 'Maths Paper 2 (Pure & Mechanics)', board: 'AQA/Edexcel' },
      { date: '2025-05-20', label: 'Biology Paper 2', board: 'AQA' },
      { date: '2025-05-21', label: 'Chemistry Paper 2', board: 'AQA/Edexcel' },
      { date: '2025-06-03', label: 'Physics Paper 2', board: 'AQA/Edexcel' },
      { date: '2025-06-04', label: 'Maths Paper 3 (Statistics & Mechanics)', board: 'AQA/Edexcel' },
      { date: '2025-06-05', label: 'History Paper 2', board: 'AQA/Edexcel' },
      { date: '2025-06-09', label: 'Biology Paper 3', board: 'AQA' },
      { date: '2025-06-10', label: 'Chemistry Paper 3', board: 'AQA/Edexcel' },
      { date: '2025-06-11', label: 'Physics Paper 3', board: 'AQA/Edexcel' },
    ],
    officialUrl: 'https://www.aqa.org.uk/exams-administration/exams-guidance/find-timetables',
  },

  sat: {
    board: 'College Board',
    window: '2025–2026 Academic Year',
    sessions: [
      { date: '2025-08-23', label: 'SAT — August sitting', board: 'College Board', registration: '2025-07-25' },
      { date: '2025-10-04', label: 'SAT — October sitting', board: 'College Board', registration: '2025-09-05' },
      { date: '2025-11-01', label: 'SAT — November sitting', board: 'College Board', registration: '2025-10-03' },
      { date: '2025-12-06', label: 'SAT — December sitting', board: 'College Board', registration: '2025-11-07' },
      { date: '2026-03-14', label: 'SAT — March sitting', board: 'College Board', registration: '2026-02-13' },
      { date: '2026-05-02', label: 'SAT — May sitting', board: 'College Board', registration: '2026-04-03' },
      { date: '2026-06-06', label: 'SAT — June sitting', board: 'College Board', registration: '2026-05-08' },
    ],
    officialUrl: 'https://satsuite.collegeboard.org/sat/registration/dates-deadlines',
  },

  act: {
    board: 'ACT Inc.',
    window: '2025–2026 Academic Year',
    sessions: [
      { date: '2025-09-13', label: 'ACT — September sitting', board: 'ACT Inc.', registration: '2025-08-08' },
      { date: '2025-10-25', label: 'ACT — October sitting', board: 'ACT Inc.', registration: '2025-09-19' },
      { date: '2025-12-13', label: 'ACT — December sitting', board: 'ACT Inc.', registration: '2025-11-07' },
      { date: '2026-02-07', label: 'ACT — February sitting', board: 'ACT Inc.', registration: '2026-01-02' },
      { date: '2026-04-18', label: 'ACT — April sitting', board: 'ACT Inc.', registration: '2026-03-13' },
      { date: '2026-06-13', label: 'ACT — June sitting', board: 'ACT Inc.', registration: '2026-05-08' },
      { date: '2026-07-18', label: 'ACT — July sitting', board: 'ACT Inc.', registration: '2026-06-19' },
    ],
    officialUrl: 'https://www.act.org/content/act/en/products-and-services/the-act/registration.html',
  },

  ap: {
    board: 'College Board',
    window: 'May 2026 AP Exam Week',
    sessions: [
      { date: '2026-05-04', label: 'AP Calculus AB / BC · AP Statistics', board: 'College Board' },
      { date: '2026-05-05', label: 'AP English Literature · AP Chemistry', board: 'College Board' },
      { date: '2026-05-06', label: 'AP US History · AP Computer Science A', board: 'College Board' },
      { date: '2026-05-07', label: 'AP Biology · AP Physics 1', board: 'College Board' },
      { date: '2026-05-08', label: 'AP English Language · AP World History', board: 'College Board' },
      { date: '2026-05-11', label: 'AP Physics 2 / C · AP Human Geography', board: 'College Board' },
      { date: '2026-05-12', label: 'AP Psychology · AP US Government', board: 'College Board' },
      { date: '2026-05-13', label: 'AP European History · AP Macro/Microeconomics', board: 'College Board' },
      { date: '2026-05-14', label: 'AP Environmental Science · AP Art History', board: 'College Board' },
    ],
    officialUrl: 'https://apstudents.collegeboard.org/exam-calendar',
  },

  psat: {
    board: 'College Board',
    window: 'Autumn 2025',
    sessions: [
      { date: '2025-10-15', label: 'PSAT/NMSQT — Primary sitting (school-administered)', board: 'College Board' },
      { date: '2025-10-22', label: 'PSAT/NMSQT — Alternate sitting (school-administered)', board: 'College Board' },
      { date: '2026-01-24', label: 'PSAT 10 — Spring sitting (school-administered)', board: 'College Board' },
    ],
    officialUrl: 'https://satsuite.collegeboard.org/psat-nmsqt/registration',
  },

  igcse: {
    board: 'Cambridge Assessment International Education / Pearson Edexcel International',
    window: 'May–June 2026',
    sessions: [
      { date:'2026-05-04', label:'Maths Paper 1 (Core & Extended)', board:'Cambridge/Edexcel' },
      { date:'2026-05-06', label:'English Language Paper 1', board:'Cambridge/Edexcel' },
      { date:'2026-05-08', label:'English Literature Paper 1', board:'Cambridge/Edexcel' },
      { date:'2026-05-11', label:'Biology Paper 1', board:'Cambridge' },
      { date:'2026-05-11', label:'Combined Science Paper 1', board:'Cambridge' },
      { date:'2026-05-13', label:'Chemistry Paper 1', board:'Cambridge' },
      { date:'2026-05-15', label:'Physics Paper 1', board:'Cambridge' },
      { date:'2026-05-18', label:'History Paper 1', board:'Cambridge/Edexcel' },
      { date:'2026-05-19', label:'Geography Paper 1', board:'Cambridge/Edexcel' },
      { date:'2026-05-20', label:'Economics Paper 1', board:'Cambridge/Edexcel' },
      { date:'2026-05-21', label:'Business Studies Paper 1', board:'Cambridge/Edexcel' },
      { date:'2026-05-22', label:'Computer Science Paper 1', board:'Cambridge/Edexcel' },
      { date:'2026-05-25', label:'Spanish as a Foreign Language', board:'Cambridge/Edexcel' },
      { date:'2026-05-26', label:'French as a Foreign Language', board:'Cambridge/Edexcel' },
      { date:'2026-06-01', label:'Maths Paper 2 (Core & Extended)', board:'Cambridge/Edexcel' },
      { date:'2026-06-03', label:'Biology Paper 2', board:'Cambridge' },
      { date:'2026-06-05', label:'Chemistry Paper 2', board:'Cambridge' },
      { date:'2026-06-08', label:'Physics Paper 2', board:'Cambridge' },
    ],
    officialUrl: 'https://www.cambridgeinternational.org/exam-administration/cambridge-exams-officers-guide/exam-timetable/',
  },

  ib: {
    board: 'International Baccalaureate Organisation (IBO)',
    window: 'May 2026 Examination Session',
    sessions: [
      { date:'2026-03-15', label:'Extended Essay final deadline', board:'IBO', registration:'2026-01-15' },
      { date:'2026-04-01', label:'ToK Essay submission deadline', board:'IBO' },
      { date:'2026-04-20', label:'Internal Assessments submission deadline', board:'IBO' },
      { date:'2026-05-04', label:'English A: Language & Literature Paper 1', board:'IBO' },
      { date:'2026-05-04', label:'English A: Literature Paper 1', board:'IBO' },
      { date:'2026-05-05', label:'Biology Paper 1 & 2', board:'IBO' },
      { date:'2026-05-06', label:'Maths: Analysis & Approaches Paper 1', board:'IBO' },
      { date:'2026-05-06', label:'Maths: Applications & Interpretation Paper 1', board:'IBO' },
      { date:'2026-05-07', label:'History Paper 1 & 2', board:'IBO' },
      { date:'2026-05-08', label:'Chemistry Paper 1 & 2', board:'IBO' },
      { date:'2026-05-11', label:'Physics Paper 1 & 2', board:'IBO' },
      { date:'2026-05-12', label:'Economics Paper 1 & 2', board:'IBO' },
      { date:'2026-05-13', label:'Geography Paper 1 & 2', board:'IBO' },
      { date:'2026-05-14', label:'Psychology Paper 1 & 2', board:'IBO' },
      { date:'2026-05-15', label:'Computer Science Paper 1 & 2', board:'IBO' },
      { date:'2026-05-18', label:'Business Management Paper 1 & 2', board:'IBO' },
      { date:'2026-05-19', label:'French B Paper 1 & 2', board:'IBO' },
      { date:'2026-05-19', label:'Spanish B Paper 1 & 2', board:'IBO' },
      { date:'2026-05-20', label:'Mandarin B Paper 1 & 2', board:'IBO' },
      { date:'2026-05-22', label:'Theory of Knowledge Exhibition presentation', board:'IBO' },
      { date:'2026-05-26', label:'Maths: Analysis & Approaches Paper 2 & 3', board:'IBO' },
      { date:'2026-05-26', label:'Maths: Applications & Interpretation Paper 2 & 3', board:'IBO' },
    ],
    officialUrl: 'https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/exam-schedule/',
  },
}
