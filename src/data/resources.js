/**
 * resources.js — curated books, revision guides, and free online resources
 * per stream × subject. Update when syllabuses change.
 */

// Resource types
// 'textbook'      — main course textbook
// 'revision'      — revision guide / workbook
// 'free-online'   — free website, video series, or open resource
// 'practice'      — past papers or question bank

export const RESOURCES = {

  // ── GCSE ────────────────────────────────────────────────────────────────────
  gcse: {
    _stream: { label: 'GCSE', region: 'UK (England, Wales, NI)' },
    maths: [
      { title: 'GCSE Mathematics AQA (Higher)', author: 'Michael White', type: 'textbook', publisher: 'Collins' },
      { title: 'CGP GCSE Maths Complete Revision & Practice', type: 'revision', publisher: 'CGP Books' },
      { title: 'Corbettmaths', type: 'free-online', url: 'https://corbettmaths.com', desc: 'Videos, worksheets, 5-a-day' },
      { title: 'Mathswatch VLE', type: 'free-online', url: 'https://vle.mathswatch.co.uk', desc: 'Interactive video lessons' },
      { title: 'AQA Past Papers', type: 'practice', url: 'https://www.aqa.org.uk/subjects/mathematics/gcse', desc: '2017–2024 papers + mark schemes' },
    ],
    english: [
      { title: 'York Notes for GCSE: Power & Conflict Poetry', type: 'revision', publisher: 'York Notes' },
      { title: 'CGP GCSE English Language & Literature', type: 'revision', publisher: 'CGP Books' },
      { title: 'BBC Bitesize GCSE English', type: 'free-online', url: 'https://www.bbc.co.uk/bitesize/examspecs/zrb2bdm', desc: 'Free revision with examples' },
      { title: 'No Fear Shakespeare', type: 'free-online', url: 'https://www.sparknotes.com/shakespeare/', desc: 'Modern English side-by-side' },
      { title: 'AQA English Past Papers', type: 'practice', url: 'https://www.aqa.org.uk/subjects/english/gcse', desc: '2017–2024 papers + mark schemes' },
    ],
    biology: [
      { title: 'GCSE Biology AQA Revision Guide', author: 'Cgp Books', type: 'revision', publisher: 'CGP Books' },
      { title: 'AQA GCSE Biology Student Book', author: 'Barker & Saunders', type: 'textbook', publisher: 'Hodder Education' },
      { title: 'Save My Exams — GCSE Biology', type: 'free-online', url: 'https://www.savemyexams.co.uk/gcse/biology/', desc: 'Notes, flashcards, Q&A by topic' },
      { title: 'BBC Bitesize Biology', type: 'free-online', url: 'https://www.bbc.co.uk/bitesize/subjects/z9ddmp3', desc: 'Free revision organised by spec' },
    ],
    chemistry: [
      { title: 'GCSE Chemistry AQA Revision Guide', type: 'revision', publisher: 'CGP Books' },
      { title: 'AQA GCSE Chemistry Student Book', author: 'Ted Lister & Janet Renshaw', type: 'textbook', publisher: 'Hodder Education' },
      { title: 'ChemRevise', type: 'free-online', url: 'https://chemrevise.org', desc: 'Free notes & worksheets by topic' },
      { title: 'Kognity GCSE Chemistry', type: 'free-online', url: 'https://kognity.com', desc: 'Interactive digital textbook' },
    ],
    physics: [
      { title: 'GCSE Physics AQA Revision Guide', type: 'revision', publisher: 'CGP Books' },
      { title: 'AQA GCSE Physics Student Book', author: 'Jim Breithaupt', type: 'textbook', publisher: 'Oxford University Press' },
      { title: 'Physics and Maths Tutor', type: 'free-online', url: 'https://www.physicsandmathstutor.com', desc: 'Past papers, notes, videos' },
    ],
    history: [
      { title: 'GCSE History AQA Complete Revision', type: 'revision', publisher: 'CGP Books' },
      { title: 'BBC Bitesize History', type: 'free-online', url: 'https://www.bbc.co.uk/bitesize/subjects/zk26n39', desc: 'Event timelines & essay guides' },
      { title: 'Seneca Learning — History', type: 'free-online', url: 'https://senecalearning.com', desc: 'AI-powered smart revision' },
    ],
    geography: [
      { title: 'GCSE Geography AQA Revision Guide', type: 'revision', publisher: 'CGP Books' },
      { title: 'CGP GCSE Geography AQA Complete Revision', type: 'revision', publisher: 'CGP Books' },
      { title: 'Geography All the Way', type: 'free-online', url: 'https://www.geographyalltheway.com', desc: 'Case studies, revision notes' },
    ],
  },

  // ── A-Level ─────────────────────────────────────────────────────────────────
  alevel: {
    _stream: { label: 'A-Level', region: 'UK (England)' },
    maths: [
      { title: 'Edexcel AS and A Level Mathematics', author: 'Greg Attwood et al.', type: 'textbook', publisher: 'Pearson' },
      { title: 'CGP A-Level Maths Complete Revision & Practice', type: 'revision', publisher: 'CGP Books' },
      { title: 'Physics and Maths Tutor — A-Level Maths', type: 'free-online', url: 'https://www.physicsandmathstutor.com/maths', desc: 'Past papers + worked solutions' },
      { title: '3Blue1Brown: Essence of Calculus', type: 'free-online', url: 'https://www.youtube.com/@3blue1brown', desc: 'Deep visual understanding of calculus' },
      { title: 'Underground Mathematics', type: 'free-online', url: 'https://undergroundmathematics.org', desc: 'Cambridge A-Level enrichment problems' },
    ],
    physics: [
      { title: 'A Level Physics AQA Student Book', author: 'Jim Breithaupt', type: 'textbook', publisher: 'Oxford University Press' },
      { title: 'CGP A-Level Physics AQA Revision', type: 'revision', publisher: 'CGP Books' },
      { title: 'Physics and Maths Tutor — Physics', type: 'free-online', url: 'https://www.physicsandmathstutor.com/physics', desc: 'Past papers, mark schemes, notes' },
      { title: 'Khan Academy — Physics', type: 'free-online', url: 'https://www.khanacademy.org/science/physics', desc: 'Free videos and practice' },
    ],
    chemistry: [
      { title: 'A-Level Chemistry AQA Student Book', author: 'Ted Lister & Janet Renshaw', type: 'textbook', publisher: 'Hodder Education' },
      { title: 'CGP A-Level Chemistry AQA Complete Revision', type: 'revision', publisher: 'CGP Books' },
      { title: 'ChemRevise — A-Level', type: 'free-online', url: 'https://chemrevise.org', desc: 'Free notes covering every AQA topic' },
    ],
    biology: [
      { title: 'A Level Biology AQA Student Book', author: 'Glenn Toole & Susan Toole', type: 'textbook', publisher: 'Oxford University Press' },
      { title: 'CGP A-Level Biology AQA Revision', type: 'revision', publisher: 'CGP Books' },
      { title: 'Save My Exams — A-Level Biology', type: 'free-online', url: 'https://www.savemyexams.co.uk/a-level/biology/', desc: 'Exam-ready notes and Q&A' },
    ],
    history: [
      { title: 'Mastering Modern British History', author: 'Norman Lowe', type: 'textbook', publisher: 'Palgrave Macmillan' },
      { title: 'CGP A-Level History Complete Revision', type: 'revision', publisher: 'CGP Books' },
      { title: 'Encyclopaedia Britannica', type: 'free-online', url: 'https://www.britannica.com', desc: 'Primary and secondary source summaries' },
    ],
    economics: [
      { title: 'Economics', author: 'Alain Anderton', type: 'textbook', publisher: 'Hodder Education' },
      { title: 'CGP A-Level Economics Revision', type: 'revision', publisher: 'CGP Books' },
      { title: 'Economics Help', type: 'free-online', url: 'https://www.economicshelp.org', desc: 'Free explanations and diagrams' },
    ],
    psychology: [
      { title: 'AQA Psychology for A Level Year 1 & 2', author: 'Cara Flanagan', type: 'textbook', publisher: 'Illuminate Publishing' },
      { title: 'CGP A-Level Psychology AQA Revision', type: 'revision', publisher: 'CGP Books' },
      { title: 'Simply Psychology', type: 'free-online', url: 'https://www.simplypsychology.org', desc: 'Clear summaries of all key studies' },
    ],
  },

  // ── SAT ─────────────────────────────────────────────────────────────────────
  sat: {
    _stream: { label: 'SAT', region: 'USA / International' },
    math: [
      { title: 'The Official Digital SAT Study Guide', author: 'College Board', type: 'textbook', publisher: 'College Board' },
      { title: 'Princeton Review SAT Prep', author: 'Princeton Review', type: 'revision', publisher: 'Princeton Review' },
      { title: 'Barron\'s SAT Premium Study Guide', type: 'revision', publisher: 'Barron\'s Educational Series' },
      { title: 'Khan Academy SAT Practice', type: 'free-online', url: 'https://www.khanacademy.org/sat', desc: 'Official College Board + Khan Academy — free, personalised' },
      { title: 'College Board Digital SAT Practice', type: 'practice', url: 'https://bluebook.collegeboard.org', desc: 'Official full-length digital practice tests' },
    ],
    english: [
      { title: 'The Official Digital SAT Study Guide', author: 'College Board', type: 'textbook', publisher: 'College Board' },
      { title: 'Erica Meltzer\'s The Critical Reader', author: 'Erica Meltzer', type: 'revision', publisher: 'The Critical Reader' },
      { title: 'Khan Academy SAT Reading & Writing', type: 'free-online', url: 'https://www.khanacademy.org/sat', desc: 'Free lessons aligned to every skill' },
    ],
    reading: [
      { title: 'PWN the SAT: Reading Guide', author: 'Mike McClenathan', type: 'revision', publisher: 'CreateSpace' },
      { title: 'Vocab from Classical Roots', author: 'Norma Fifer', type: 'textbook', publisher: 'Educators Publishing Service' },
      { title: 'College Board Question Bank', type: 'practice', url: 'https://satsuite.collegeboard.org', desc: 'Official digital SAT questions sorted by skill' },
    ],
  },

  // ── ACT ─────────────────────────────────────────────────────────────────────
  act: {
    _stream: { label: 'ACT', region: 'USA' },
    math: [
      { title: 'The Official ACT Prep Guide', author: 'ACT Inc.', type: 'textbook', publisher: 'Wiley' },
      { title: 'Princeton Review ACT Prep 2025', type: 'revision', publisher: 'Princeton Review' },
      { title: 'ACT Math: Barron\'s 10 Practice Tests', type: 'practice', publisher: 'Barron\'s Educational Series' },
      { title: 'Khan Academy — ACT Math Skills', type: 'free-online', url: 'https://www.khanacademy.org', desc: 'Free aligned practice' },
    ],
    english: [
      { title: 'The Official ACT Prep Guide', author: 'ACT Inc.', type: 'textbook', publisher: 'Wiley' },
      { title: 'Erica Meltzer\'s The Complete Guide to ACT English', author: 'Erica Meltzer', type: 'revision', publisher: 'The Critical Reader' },
    ],
    science: [
      { title: 'The Official ACT Prep Guide — Science Section', author: 'ACT Inc.', type: 'textbook', publisher: 'Wiley' },
      { title: 'Kaplan ACT Science Review Notes', type: 'revision', publisher: 'Kaplan' },
      { title: 'CK-12 FlexBook — Life Science', type: 'free-online', url: 'https://www.ck12.org', desc: 'Free digital science textbook' },
    ],
    reading: [
      { title: 'Barron\'s ACT Premium', type: 'revision', publisher: 'Barron\'s Educational Series' },
      { title: 'PrepScholar ACT Study Guide', type: 'free-online', url: 'https://www.prepscholar.com/act', desc: 'Free strategy guides and diagnostics' },
    ],
  },

  // ── AP ──────────────────────────────────────────────────────────────────────
  ap: {
    _stream: { label: 'AP Exams', region: 'USA' },
    calculus: [
      { title: 'Calculus: Graphical, Numerical, Algebraic', author: 'Finney, Ross & Demana', type: 'textbook', publisher: 'Pearson' },
      { title: 'Princeton Review AP Calculus AB/BC Prep', type: 'revision', publisher: 'Princeton Review' },
      { title: 'Khan Academy — AP Calculus', type: 'free-online', url: 'https://www.khanacademy.org/math/ap-calculus-ab', desc: 'Free full course aligned to AP curriculum' },
      { title: 'AP Classroom (via College Board)', type: 'practice', url: 'https://apclassroom.collegeboard.org', desc: 'Official AP practice questions + FRQs' },
    ],
    physics: [
      { title: 'Physics: Principles with Applications', author: 'Douglas Giancoli', type: 'textbook', publisher: 'Pearson' },
      { title: 'Barron\'s AP Physics 1 & 2', type: 'revision', publisher: 'Barron\'s Educational Series' },
      { title: 'AP Physics with Flipping Physics', type: 'free-online', url: 'https://www.flippingphysics.com', desc: 'Free AP-aligned video lessons' },
    ],
    biology: [
      { title: 'Campbell Biology AP Edition', author: 'Jane Reece et al.', type: 'textbook', publisher: 'Pearson' },
      { title: 'Barron\'s AP Biology', type: 'revision', publisher: 'Barron\'s Educational Series' },
      { title: 'Khan Academy — AP Biology', type: 'free-online', url: 'https://www.khanacademy.org/science/ap-biology', desc: 'Full AP course free' },
    ],
    chemistry: [
      { title: 'Chemistry: The Central Science AP Edition', author: 'Brown, LeMay & Bursten', type: 'textbook', publisher: 'Pearson' },
      { title: 'Princeton Review AP Chemistry Prep', type: 'revision', publisher: 'Princeton Review' },
    ],
    history: [
      { title: 'The American Pageant AP Edition', author: 'Kennedy & Cohen', type: 'textbook', publisher: 'Cengage' },
      { title: 'Barron\'s AP US History', type: 'revision', publisher: 'Barron\'s Educational Series' },
      { title: 'Heimler\'s History', type: 'free-online', url: 'https://www.youtube.com/@heimlershistory', desc: 'Free AP History videos by topic' },
    ],
    english: [
      { title: 'The Language of Composition', author: 'Shea, Scanlon & Aufses', type: 'textbook', publisher: 'Bedford / St. Martin\'s' },
      { title: 'Princeton Review AP English Language & Composition', type: 'revision', publisher: 'Princeton Review' },
    ],
    statistics: [
      { title: 'The Practice of Statistics AP Edition', author: 'Starnes, Tabor & Yates', type: 'textbook', publisher: 'W. H. Freeman' },
      { title: 'Barron\'s AP Statistics', type: 'revision', publisher: 'Barron\'s Educational Series' },
      { title: 'Khan Academy — AP Statistics', type: 'free-online', url: 'https://www.khanacademy.org/math/ap-statistics', desc: 'Full AP course free' },
    ],
  },

  // ── PSAT ────────────────────────────────────────────────────────────────────
  psat: {
    _stream: { label: 'PSAT / NMSQT', region: 'USA' },
    math: [
      { title: 'Official PSAT/NMSQT Study Guide', author: 'College Board', type: 'textbook', publisher: 'College Board' },
      { title: 'Princeton Review PSAT/NMSQT Prep', type: 'revision', publisher: 'Princeton Review' },
      { title: 'Khan Academy SAT/PSAT Math', type: 'free-online', url: 'https://www.khanacademy.org/sat', desc: 'PSAT and SAT share the same math curriculum' },
    ],
    english: [
      { title: 'Official PSAT/NMSQT Study Guide', author: 'College Board', type: 'textbook', publisher: 'College Board' },
      { title: 'Erica Meltzer\'s The Critical Reader (SAT/PSAT)', author: 'Erica Meltzer', type: 'revision', publisher: 'The Critical Reader' },
      { title: 'College Board PSAT Practice Tests', type: 'practice', url: 'https://satsuite.collegeboard.org/psat-nmsqt/practice', desc: 'Official free practice tests' },
    ],
  },
}

/** Returns the resource list for a given stream and subject (case-insensitive match). */
export function getResources(stream, subject) {
  const streamData = RESOURCES[stream]
  if (!streamData) return []
  const key = Object.keys(streamData).find(k => k !== '_stream' && k.toLowerCase() === subject?.toLowerCase())
  return key ? (streamData[key] ?? []) : []
}

/** Returns all subjects that have resource data for a given stream. */
export function getResourceSubjects(stream) {
  const streamData = RESOURCES[stream]
  if (!streamData) return []
  return Object.keys(streamData).filter(k => k !== '_stream')
}
