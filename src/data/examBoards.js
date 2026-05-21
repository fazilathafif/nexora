/**
 * examBoards.js — per-subject exam board registry.
 *
 * Architecture:
 *  - EXAM_BOARDS[subjectId].boards  → list of boards for the selector
 *  - EXAM_BOARDS[subjectId].topicsByBoard → which topics are in scope per board
 *    (used for future filtering; today all questions are served regardless of board)
 *  - Board preference is stored in localStorage under 'nexora_board_<subjectId>'
 *
 * TODO: once questions carry a `boards` array, getQuestions() can filter by board.
 */

export const EXAM_BOARDS = {
  spanish: {
    boards: ['AQA', 'Edexcel', 'OCR', 'Eduqas', 'WJEC'],
    topicsByBoard: {
      AQA:     ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      Edexcel: ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      OCR:     ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      Eduqas:  ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      WJEC:    ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
    },
  },
  french: {
    boards: ['AQA', 'Edexcel', 'OCR', 'Eduqas', 'WJEC'],
    topicsByBoard: {
      AQA:     ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      Edexcel: ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      OCR:     ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      Eduqas:  ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      WJEC:    ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
    },
  },
  german: {
    boards: ['AQA', 'Edexcel', 'OCR', 'Eduqas', 'WJEC'],
    topicsByBoard: {
      AQA:     ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      Edexcel: ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      OCR:     ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      Eduqas:  ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
      WJEC:    ['Identity and Culture', 'Local, National and Global', 'School and Future Plans'],
    },
  },
  business: {
    boards: ['AQA', 'Edexcel', 'OCR', 'Eduqas'],
    topicsByBoard: {
      AQA:     ['Business Activity', 'Marketing', 'Finance', 'Operations', 'Human Resources', 'External Influences'],
      Edexcel: ['Business Activity', 'Marketing', 'Finance', 'Operations', 'Human Resources', 'External Influences'],
      OCR:     ['Business Activity', 'Marketing', 'Finance', 'Operations', 'Human Resources', 'External Influences'],
      Eduqas:  ['Business Activity', 'Marketing', 'Finance', 'Operations', 'Human Resources', 'External Influences'],
    },
  },
  history: {
    boards: ['AQA', 'Edexcel', 'OCR', 'Eduqas'],
    topicsByBoard: {
      AQA:     ['Medicine Through Time', 'Weimar and Nazi Germany', 'Elizabethan England', 'Source Analysis & Essay Technique'],
      Edexcel: ['Medicine Through Time', 'Weimar and Nazi Germany', 'America 1920–1973', 'Source Analysis & Essay Technique'],
      OCR:     ['Medicine Through Time', 'Cold War 1945–1991', 'America 1920–1973', 'Source Analysis & Essay Technique'],
      Eduqas:  ['Medicine Through Time', 'Elizabethan England', 'Cold War 1945–1991', 'Source Analysis & Essay Technique'],
    },
  },
  englishlit: {
    boards: ['AQA', 'Edexcel', 'OCR', 'Eduqas', 'WJEC'],
    topicsByBoard: {
      AQA:     ['Shakespeare – Macbeth', '19th Century Novel – A Christmas Carol', 'Modern Texts – An Inspector Calls', 'Poetry – Power & Conflict', 'Unseen Poetry'],
      Edexcel: ['Shakespeare – Macbeth', '19th Century Novel – Jekyll & Hyde', 'Modern Texts – Lord of the Flies', 'Poetry – Love & Relationships', 'Unseen Poetry'],
      OCR:     ['Shakespeare – Macbeth', '19th Century Novel – Great Expectations', 'Modern Texts – Animal Farm', 'Poetry – Power & Conflict', 'Unseen Poetry'],
      Eduqas:  ['Shakespeare – Romeo & Juliet', '19th Century Novel – A Christmas Carol', 'Modern Texts – An Inspector Calls', 'Poetry – Love & Relationships', 'Unseen Poetry'],
      WJEC:    ['Shakespeare – Romeo & Juliet', '19th Century Novel – Jekyll & Hyde', 'Modern Texts – Animal Farm', 'Poetry – Power & Conflict', 'Unseen Poetry'],
    },
  },
  cs: {
    boards: ['AQA', 'OCR', 'Edexcel'],
    topicsByBoard: {
      AQA:     ['Algorithms & Pseudocode', 'Programming Fundamentals', 'Data Representation', 'Computer Systems', 'Networks & the Internet', 'Cybersecurity', 'Databases & SQL', 'Ethical, Legal & Environmental Issues'],
      OCR:     ['Algorithms & Pseudocode', 'Programming Fundamentals', 'Data Representation', 'Computer Systems', 'Networks & the Internet', 'Cybersecurity', 'Ethical, Legal & Environmental Issues'],
      Edexcel: ['Algorithms & Pseudocode', 'Programming Fundamentals', 'Data Representation', 'Computer Systems', 'Networks & the Internet', 'Cybersecurity', 'Databases & SQL', 'Ethical, Legal & Environmental Issues'],
    },
  },
  rs: {
    boards: ['AQA', 'Edexcel', 'OCR', 'Eduqas'],
    topicsByBoard: {
      AQA:     ['Christianity – Beliefs', 'Christianity – Practices', 'Islam – Beliefs', 'Islam – Practices', 'Themes – Relationships & Families', 'Themes – Religion & Life', 'Themes – Crime & Punishment', 'Themes – Peace & Conflict'],
      Edexcel: ['Christianity – Beliefs', 'Christianity – Practices', 'Islam – Beliefs', 'Islam – Practices', 'Themes – Relationships & Families', 'Themes – Religion & Life', 'Themes – Crime & Punishment', 'Themes – Peace & Conflict'],
      OCR:     ['Christianity – Beliefs', 'Christianity – Practices', 'Islam – Beliefs', 'Islam – Practices', 'Themes – Relationships & Families', 'Themes – Religion & Life', 'Themes – Crime & Punishment', 'Themes – Peace & Conflict'],
      Eduqas:  ['Christianity – Beliefs', 'Christianity – Practices', 'Islam – Beliefs', 'Islam – Practices', 'Themes – Relationships & Families', 'Themes – Religion & Life', 'Themes – Crime & Punishment', 'Themes – Peace & Conflict'],
    },
  },
}

/** Returns the saved board for a subject, or the first board as default. */
export function getSavedBoard(subjectId) {
  const config = EXAM_BOARDS[subjectId]
  if (!config) return null
  return localStorage.getItem(`nexora_board_${subjectId}`) ?? config.boards[0]
}

/** Persists the selected board for a subject. */
export function saveBoard(subjectId, board) {
  localStorage.setItem(`nexora_board_${subjectId}`, board)
}

/** Returns the saved tier for a subject ('foundation' | 'higher'), defaulting to 'foundation'. */
export function getSavedTier(subjectId) {
  return localStorage.getItem(`nexora_tier_${subjectId}`) ?? 'foundation'
}

/** Persists the selected tier for a subject. */
export function saveTier(subjectId, tier) {
  localStorage.setItem(`nexora_tier_${subjectId}`, tier)
}

/** Returns the saved EBacc language preference (subject id, e.g. 'spanish'), or null. */
export function getEbaccLang() {
  return localStorage.getItem('nexora_ebacc_lang') ?? null
}

/** Persists the EBacc language preference. */
export function saveEbaccLang(lang) {
  localStorage.setItem('nexora_ebacc_lang', lang)
}
