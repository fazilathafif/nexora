// Shared MFL framework — Spanish, French, German GCSE
// All three languages use the same themes and skill taxonomy

export const MFL_SKILLS = ['Reading', 'Writing', 'Translation', 'Grammar', 'Vocabulary', 'Listening']

// AQA/Edexcel/OCR/Eduqas themes — used for topic organisation
export const MFL_THEMES = [
  {
    id: 'identity',
    label: 'Identity and Culture',
    subtopics: [
      'Family and Friends',
      'Free Time and Hobbies',
      'Technology and Social Media',
      'Customs and Traditions',
    ],
  },
  {
    id: 'local',
    label: 'Local, National and Global',
    subtopics: [
      'Home and Town',
      'Social Issues',
      'Environment',
      'Global Events and Travel',
    ],
  },
  {
    id: 'school_work',
    label: 'School and Future Plans',
    subtopics: [
      'School Life',
      'Jobs and Career',
      'Further Education',
      'Work Experience',
    ],
  },
]

// Grammar points per language — used to tag questions
export const MFL_GRAMMAR = {
  es: [
    'Present Tense',
    'Preterite Tense',
    'Imperfect Tense',
    'Future Tense',
    'Conditional Tense',
    'Subjunctive',
    'Ser vs Estar',
    'Reflexive Verbs',
    'Gender and Agreement',
    'Object Pronouns',
  ],
  fr: [
    'Present Tense',
    'Passé Composé',
    'Imparfait',
    'Future Proche',
    'Futur Simple',
    'Conditionnel',
    'Subjonctif',
    'Reflexive Verbs',
    'Gender and Agreement',
    'Object Pronouns',
  ],
  de: [
    'Present Tense',
    'Perfekt',
    'Imperfekt',
    'Future Tense',
    'Modal Verbs',
    'Cases (Nominative/Accusative/Dative)',
    'Word Order',
    'Adjective Endings',
    'Separable Verbs',
    'Reflexive Verbs',
  ],
}

export const MFL_BOARDS = ['AQA', 'Edexcel', 'OCR', 'Eduqas', 'WJEC']
export const MFL_TIERS   = ['foundation', 'higher']
