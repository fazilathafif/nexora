export const ANXIETY_TIPS = [
  {
    id: 'reframe',   emoji: '🧠', category: 'CBT',
    title: 'Cognitive Reframing',
    short: 'Challenge catastrophic thoughts before they spiral.',
    tips: [
      'Write down your worst-case thought, then write 3 realistic counter-arguments.',
      'Ask: "What would I tell a friend who was thinking this?"',
      'Rate the likelihood of the worst case actually happening (usually < 10%).',
    ],
  },
  {
    id: 'grounding', emoji: '🌿', category: 'Mindfulness',
    title: '5-4-3-2-1 Grounding',
    short: 'Bring your mind back to the present in 60 seconds.',
    tips: [
      'Name 5 things you can see.',
      'Name 4 things you can touch.',
      'Name 3 things you can hear.',
      'Name 2 things you can smell.',
      'Name 1 thing you can taste.',
    ],
  },
  {
    id: 'sleep',     emoji: '😴', category: 'Sleep',
    title: 'Sleep Hygiene',
    short: 'Quality sleep improves memory consolidation by up to 40%.',
    tips: [
      'Stop screens 60 min before bed — blue light delays melatonin release.',
      'Keep the same sleep/wake time even on exam week.',
      "If you can't sleep, do the box breathing exercise above.",
    ],
  },
  {
    id: 'nutrition', emoji: '🥗', category: 'Nutrition',
    title: 'Exam Day Nutrition',
    short: 'What you eat before an exam affects focus for hours.',
    tips: [
      'Eat a slow-release carb breakfast (oats, wholegrain toast) 2+ hours before.',
      'Stay hydrated — even mild dehydration impairs recall.',
      'Avoid high-sugar snacks: the energy crash hits mid-exam.',
    ],
  },
  {
    id: 'rescue',    emoji: '🆘', category: 'Emergency',
    title: 'Mid-Exam Panic Rescue',
    short: 'If anxiety spikes during the exam, use this sequence.',
    tips: [
      'Put your pen down for 30 seconds. Permission granted.',
      'Take 3 slow breaths: 4 counts in, 4 counts out.',
      'Write one true sentence: "I have prepared for this."',
      'Move to a question you know — momentum restores confidence.',
    ],
  },
]

export const CHECKLIST_ITEMS = {
  night: [
    { id: 'n1', label: 'Pack your pencil case and stationery', emoji: '✏️' },
    { id: 'n2', label: 'Check exam start time and location',   emoji: '🗓️' },
    { id: 'n3', label: 'Lay out your exam clothes',            emoji: '👕' },
    { id: 'n4', label: 'Set two alarms',                       emoji: '⏰' },
    { id: 'n5', label: 'No new revision after 9 pm',           emoji: '📵' },
    { id: 'n6', label: 'Get to bed on time',                   emoji: '🛏️' },
  ],
  morning: [
    { id: 'm1', label: 'Eat a proper breakfast',               emoji: '🥣' },
    { id: 'm2', label: 'Bring photo ID and admission slip',    emoji: '🪪' },
    { id: 'm3', label: 'Arrive 20 minutes early',              emoji: '🚶' },
    { id: 'm4', label: 'Phone on silent and in bag',           emoji: '📴' },
    { id: 'm5', label: 'Take 3 deep breaths before entering',  emoji: '🌬️' },
  ],
}
