export const BREAKS = [
  // Health tips
  { type: 'health', emoji: '💧', text: 'Drink some water — even mild dehydration reduces concentration by up to 20%.' },
  { type: 'health', emoji: '🧘', text: 'Roll your shoulders back 3 times. Tension in your neck wastes mental energy.' },
  { type: 'health', emoji: '👁️', text: 'Look at something 20 feet away for 20 seconds. Your eyes need a break too.' },
  { type: 'health', emoji: '🌬️', text: 'Take 4 slow breaths: breathe in for 4, hold for 4, out for 4. Instant calm.' },
  { type: 'health', emoji: '🚶', text: 'Stand up and take 10 steps. Movement boosts memory consolidation by 20%.' },
  { type: 'health', emoji: '🍎', text: 'Had a snack recently? Glucose fuels your brain — grab a piece of fruit.' },
  { type: 'health', emoji: '😴', text: 'Sleep is when memories form. Aim for 8 hours tonight — it\'s not lazy, it\'s smart.' },
  { type: 'health', emoji: '☀️', text: 'If you\'ve been inside all day, step outside for 2 minutes. Natural light resets your focus.' },

  // Jokes
  { type: 'joke', emoji: '😄', text: 'Why did the student eat his homework? Because the teacher told him it was a piece of cake.' },
  { type: 'joke', emoji: '🤓', text: 'Why was the math book sad? It had too many problems.' },
  { type: 'joke', emoji: '😂', text: 'I told my chemistry teacher a joke about noble gases. No reaction.' },
  { type: 'joke', emoji: '🙃', text: 'Why can\'t you trust an atom? Because they make up everything.' },
  { type: 'joke', emoji: '😆', text: 'What did the ocean say to the beach? Nothing, it just waved.' },
  { type: 'joke', emoji: '🤪', text: 'Why did the physics teacher break up with the biology teacher? No chemistry.' },
  { type: 'joke', emoji: '😁', text: 'A photon checks into a hotel. The porter asks: "Can I help with your luggage?" Photon: "No thanks, I\'m travelling light."' },
  { type: 'joke', emoji: '😎', text: 'What do you call a fish without eyes? A fsh.' },

  // Motivational
  { type: 'motivation', emoji: '🔥', text: 'Every question you answer is a synapse strengthened. You\'re literally growing your brain right now.' },
  { type: 'motivation', emoji: '⭐', text: 'The students who ace exams aren\'t smarter — they\'re more consistent. You\'re being consistent.' },
  { type: 'motivation', emoji: '🎯', text: 'Progress, not perfection. One question at a time gets you to the finish line.' },
  { type: 'motivation', emoji: '🦾', text: 'Struggle is how learning happens. If it feels hard, that\'s a sign it\'s working.' },
  { type: 'motivation', emoji: '🏆', text: 'You\'re here when others aren\'t. That\'s the whole game.' },
  { type: 'motivation', emoji: '🚀', text: 'Small sessions every day beat one marathon session. You\'re building a habit that compounds.' },
  { type: 'motivation', emoji: '💡', text: 'The moment you want to stop is usually just before a breakthrough. Push through.' },
  { type: 'motivation', emoji: '🎓', text: 'Revision feels boring because it\'s working. Familiarity is what turns knowledge into marks.' },
]

export function getRandomBreak(lastIndex = -1) {
  let idx
  do { idx = Math.floor(Math.random() * BREAKS.length) } while (idx === lastIndex && BREAKS.length > 1)
  return { ...BREAKS[idx], index: idx }
}
