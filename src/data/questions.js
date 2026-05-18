/**
 * questions.js — the full question bank.
 *
 * Structure:
 *   Each question: { id, q, opts, ans, topic, hint, difficulty, tags }
 *   id format: "<subject>_<number>"   e.g. "maths_001"
 *   ans: 0-indexed correct option
 *   difficulty: 1 (easy) | 2 (medium) | 3 (hard)
 *   tags: string[] — for spaced repetition bucketing
 *
 * Add more questions here — the quiz engine picks them automatically.
 */

// ── GCSE STREAM ───────────────────────────────────────────────────────────────

export const GCSE = {

  maths: [
    { id:"maths_001", q:"A train covers 420 km in 3.5 hours. What is its speed in km/h?", opts:["100","110","120","130"], ans:2, topic:"Speed & Distance", hint:"Speed = Distance ÷ Time", difficulty:1, tags:["ratio","real-world"] },
    { id:"maths_002", q:"Expand and simplify: (x + 3)(x − 5)", opts:["x²−2x−15","x²+2x−15","x²−8x+15","x²+8x−15"], ans:0, topic:"Algebra", hint:"Use FOIL: First, Outer, Inner, Last", difficulty:1, tags:["algebra","expanding"] },
    { id:"maths_003", q:"What is 17.5% of £640?", opts:["£104","£108","£112","£116"], ans:2, topic:"Percentages", hint:"Find 10%, halve to get 5%, halve again for 2.5%", difficulty:1, tags:["percentages","money"] },
    { id:"maths_004", q:"The nth term of a sequence is 4n − 3. What is the 7th term?", opts:["25","27","29","31"], ans:0, topic:"Sequences", hint:"Substitute n = 7 into the formula", difficulty:1, tags:["sequences","algebra"] },
    { id:"maths_005", q:"What is the interior angle of a regular hexagon?", opts:["108°","120°","135°","140°"], ans:1, topic:"Geometry", hint:"Formula: (n−2)×180 ÷ n, where n = number of sides", difficulty:2, tags:["geometry","polygons"] },
    { id:"maths_006", q:"Solve: 3x² − 12 = 0", opts:["x=±2","x=±4","x=2 only","x=4 only"], ans:0, topic:"Quadratics", hint:"Isolate x², then square root both sides", difficulty:2, tags:["algebra","quadratics"] },
    { id:"maths_007", q:"A bag has 4 red, 3 blue, 5 green balls. P(not red) = ?", opts:["1/3","1/2","2/3","3/4"], ans:2, topic:"Probability", hint:"P(not red) = 1 − P(red). Total balls = 12", difficulty:1, tags:["probability"] },
    { id:"maths_008", q:"What is the gradient of the line 3y = 6x − 9?", opts:["2","3","6","−3"], ans:0, topic:"Straight Lines", hint:"Rearrange to y = mx + c form first", difficulty:2, tags:["coordinate-geometry","gradients"] },
  ],

  english: [
    { id:"eng_001", q:"Which sentence uses a semicolon correctly?", opts:["I like tea; and coffee.","She ran fast; however, she missed the bus.","He is tall; brown hair.","They left; early."], ans:1, topic:"Punctuation", hint:"A semicolon joins two complete, related clauses", difficulty:1, tags:["punctuation","sentences"] },
    { id:"eng_002", q:"What does 'ubiquitous' mean?", opts:["Rare and precious","Found everywhere","Extremely loud","Deeply mysterious"], ans:1, topic:"Vocabulary", hint:"Think of 'everywhere you look'", difficulty:2, tags:["vocabulary","tier-3-words"] },
    { id:"eng_003", q:"'Life is a journey with no map.' This is an example of:", opts:["Simile","Metaphor","Personification","Hyperbole"], ans:1, topic:"Literary Devices", hint:"A metaphor says one thing IS another (no 'like' or 'as')", difficulty:1, tags:["literary-devices","figurative-language"] },
    { id:"eng_004", q:"Which opening best hooks the reader in a narrative essay?", opts:["In this essay I will describe…","It was the day everything changed.","My story is about a difficult time.","I am going to tell you about…"], ans:1, topic:"Writing Craft", hint:"Show, don't tell. Drop the reader into the action.", difficulty:2, tags:["writing","narrative"] },
    { id:"eng_005", q:"Identify the subordinate clause: 'Although it rained, we played cricket.'", opts:["we played cricket","Although it rained","it rained","Although it"], ans:1, topic:"Grammar", hint:"A subordinate clause can't stand alone as a sentence", difficulty:2, tags:["grammar","clauses"] },
    { id:"eng_006", q:"'The classroom erupted in laughter.' The word 'erupted' is an example of:", opts:["Alliteration","Metaphor","Onomatopoeia","Pathetic fallacy"], ans:1, topic:"Literary Devices", hint:"A verb used figuratively to describe something as something else", difficulty:2, tags:["literary-devices","vocabulary"] },
  ],

  science: [
    { id:"sci_001", q:"What is the atomic number of carbon?", opts:["4","6","8","12"], ans:1, topic:"Chemistry – Atoms", hint:"Atomic number = number of protons. Carbon is the 6th element.", difficulty:1, tags:["chemistry","atomic-structure"] },
    { id:"sci_002", q:"Which wave type cannot travel through a vacuum?", opts:["Light","X-rays","Sound","Radio waves"], ans:2, topic:"Physics – Waves", hint:"Sound needs particles to vibrate — it needs a medium", difficulty:1, tags:["physics","waves"] },
    { id:"sci_003", q:"What is the powerhouse of the cell?", opts:["Nucleus","Ribosome","Mitochondria","Chloroplast"], ans:2, topic:"Biology – Cells", hint:"It produces ATP through aerobic respiration", difficulty:1, tags:["biology","cells"] },
    { id:"sci_004", q:"F = ma. If m = 5 kg and a = 3 m/s², what is F?", opts:["8 N","12 N","15 N","20 N"], ans:2, topic:"Physics – Forces", hint:"Just substitute the numbers directly into F = ma", difficulty:1, tags:["physics","forces","newton"] },
    { id:"sci_005", q:"What is produced at the CATHODE during electrolysis of brine?", opts:["Chlorine","Hydrogen","Oxygen","Sodium"], ans:1, topic:"Chemistry – Electrolysis", hint:"At the cathode: positive ions gain electrons. Na⁺ doesn't discharge — H⁺ does.", difficulty:3, tags:["chemistry","electrolysis"] },
    { id:"sci_006", q:"Which process converts glucose to lactic acid WITHOUT oxygen?", opts:["Aerobic respiration","Photosynthesis","Anaerobic respiration","Fermentation in yeast"], ans:2, topic:"Biology – Respiration", hint:"'An-' means without. Think of sprinting muscles that run out of oxygen.", difficulty:2, tags:["biology","respiration"] },
  ],

  verbal: [
    { id:"vrb_001", q:"Which word is the odd one out? Crimson · Scarlet · Azure · Ruby", opts:["Crimson","Scarlet","Azure","Ruby"], ans:2, topic:"Classification", hint:"Three are shades of red. One is a shade of blue.", difficulty:1, tags:["classification","vocabulary"] },
    { id:"vrb_002", q:"If ALL doctors are scientists, and SOME scientists are teachers, then:", opts:["All doctors are teachers","Some doctors may be teachers","No doctors are teachers","All teachers are doctors"], ans:1, topic:"Logical Reasoning", hint:"Draw a Venn diagram. 'Some' means partial overlap only.", difficulty:2, tags:["logic","venn"] },
    { id:"vrb_003", q:"Complete: Poet : Poem :: Sculptor : ___", opts:["Clay","Studio","Sculpture","Chisel"], ans:2, topic:"Analogies", hint:"What does a sculptor CREATE? Match the same relationship.", difficulty:1, tags:["analogies","reasoning"] },
    { id:"vrb_004", q:"A is taller than B. C is shorter than B. D is taller than A. Order tallest to shortest:", opts:["D A B C","A D B C","D A C B","A D C B"], ans:0, topic:"Ordering", hint:"Write each as an inequality: D > A > B > C", difficulty:2, tags:["ordering","logic"] },
  ],
}

// ── A-LEVEL STREAM ────────────────────────────────────────────────────────────

export const ALEVEL = {

  ucat: [
    { id:"ucat_001", q:"[Verbal Reasoning] The passage states telemedicine 'reduces barriers to access'. Which conclusion is directly supported?", opts:["All patients prefer telemedicine","Telemedicine may help rural patients access care","Telemedicine replaces hospitals entirely","Telemedicine is always cheaper than in-person care"], ans:1, topic:"Verbal Reasoning", hint:"Only accept conclusions explicitly supported — don't infer beyond the text", difficulty:2, tags:["ucat-vr","inference"] },
    { id:"ucat_002", q:"[Quantitative] A hospital has 240 beds. 65% are occupied. How many are EMPTY?", opts:["76","80","84","88"], ans:2, topic:"Quantitative Reasoning", hint:"Empty = Total − Occupied. Occupied = 0.65 × 240", difficulty:1, tags:["ucat-qr","percentages"] },
    { id:"ucat_003", q:"[Decision Making] A capacitous patient refuses a life-saving blood transfusion on religious grounds. The doctor should:", opts:["Override the refusal — life takes precedence","Respect the refusal — autonomy is paramount","Seek a court order","Consult family before deciding"], ans:1, topic:"Decision Making", hint:"Mental Capacity Act 2005: adults with capacity have absolute right to refuse treatment", difficulty:2, tags:["ucat-dm","ethics","capacity"] },
    { id:"ucat_004", q:"[Situational Judgement] You see a senior colleague make a drug dosing error but the patient hasn't been harmed. You should:", opts:["Ignore it — no harm was done","Raise it with the colleague privately first","Report immediately to the GMC","Tell other junior colleagues"], ans:1, topic:"Situational Judgement", hint:"GMC Good Medical Practice: raise concerns at the lowest appropriate level first", difficulty:2, tags:["ucat-sjt","professionalism"] },
    { id:"ucat_005", q:"[Abstract Reasoning] Each shape gains one side per step: triangle → square → pentagon → ? Applying the same rule to a circle gives:", opts:["Oval","Heptagon","The pattern breaks — circle has infinite sides","Square"], ans:2, topic:"Abstract Reasoning", hint:"Test the rule's limits. A circle can't gain a side in the same way.", difficulty:3, tags:["ucat-ar","pattern"] },
  ],

  lnat: [
    { id:"lnat_001", q:"'All swans observed in Europe are white, therefore all swans are white.' This argument fails because:", opts:["Swans can be black","It over-generalises from a limited sample","Europe is not a valid sample","Colour is irrelevant to classification"], ans:1, topic:"Inductive Reasoning", hint:"This is the classic problem of induction — Hume's black swan problem", difficulty:2, tags:["lnat","induction","fallacy"] },
    { id:"lnat_002", q:"A law allows deportation 'in the interests of national security' without charge. Which legal principle is MOST threatened?", opts:["Habeas corpus","Sub judice","Stare decisis","Mens rea"], ans:0, topic:"Legal Principles", hint:"Which Latin term means 'you must have the body' — the right to challenge detention?", difficulty:2, tags:["lnat","rule-of-law","rights"] },
    { id:"lnat_003", q:"'Speed cameras near schools reduce accidents.' The STRONGEST counter-argument is:", opts:["Cameras are expensive to install","Drivers slow only near cameras, not elsewhere","Schools should have crossing guards instead","Accident data may be unreliable"], ans:1, topic:"Counter-Argument", hint:"The strongest counter attacks the central claim's effect — displacement not reduction", difficulty:3, tags:["lnat","argument","counter"] },
    { id:"lnat_004", q:"Which word most precisely means 'to formally withdraw a previous statement'?", opts:["Rebuke","Recant","Rebuff","Rescind"], ans:1, topic:"Vocabulary", hint:"Recant comes from Latin 're-' (back) + 'cantare' (to sing) — to unsay", difficulty:2, tags:["lnat","vocabulary","latin"] },
  ],

  tmua: [
    { id:"tmua_001", q:"f(x) = x³ − 3x². Find f'(2).", opts:["0","2","−2","4"], ans:0, topic:"Differentiation", hint:"f'(x) = 3x² − 6x. Substitute x = 2.", difficulty:2, tags:["tmua","calculus","differentiation"] },
    { id:"tmua_002", q:"How many integers from 1–100 are divisible by BOTH 3 and 4?", opts:["6","7","8","9"], ans:2, topic:"Number Theory", hint:"Find LCM(3,4) = 12. Count multiples of 12 up to 100.", difficulty:2, tags:["tmua","number-theory","lcm"] },
    { id:"tmua_003", q:"Geometric sequence: first term 4, common ratio 3. Sum of first 4 terms?", opts:["156","160","164","168"], ans:1, topic:"Series", hint:"S_n = a(rⁿ−1)/(r−1). Substitute a=4, r=3, n=4.", difficulty:2, tags:["tmua","series","geometric"] },
    { id:"tmua_004", q:"P → Q and Q → R are both true. Which must also be true?", opts:["R → P","P → R","¬P → ¬Q","Q → P"], ans:1, topic:"Logic", hint:"Transitivity of implication: if A→B and B→C, then A→C", difficulty:2, tags:["tmua","logic","implication"] },
    { id:"tmua_005", q:"How many real solutions does x² + 4x + 5 = 0 have?", opts:["0","1","2","Cannot be determined"], ans:0, topic:"Quadratics", hint:"Compute the discriminant: b² − 4ac. What does a negative discriminant mean?", difficulty:2, tags:["tmua","quadratics","discriminant"] },
  ],

  esat: [
    { id:"esat_001", q:"Projectile launched at 30° at 20 m/s. Horizontal velocity component?", opts:["10 m/s","10√3 m/s","10√2 m/s","15 m/s"], ans:1, topic:"Mechanics", hint:"Horizontal = v·cos(30°) = 20 × (√3/2) = 10√3", difficulty:2, tags:["esat","mechanics","projectile"] },
    { id:"esat_002", q:"100 Ω and 200 Ω in parallel. Total resistance?", opts:["300 Ω","150 Ω","66.7 Ω","50 Ω"], ans:2, topic:"Electricity", hint:"1/R_total = 1/R₁ + 1/R₂ = 1/100 + 1/200", difficulty:2, tags:["esat","electricity","parallel"] },
    { id:"esat_003", q:"Relative molecular mass of H₂SO₄? (H=1, S=32, O=16)", opts:["80","96","98","100"], ans:2, topic:"Chemistry", hint:"2(1) + 32 + 4(16) = 2 + 32 + 64", difficulty:1, tags:["esat","chemistry","molar-mass"] },
    { id:"esat_004", q:"A gas at 300K doubles its absolute temperature at constant volume. Pressure:", opts:["Stays the same","Doubles","Halves","Quadruples"], ans:1, topic:"Gas Laws", hint:"Gay-Lussac's Law: P/T = constant at constant volume", difficulty:2, tags:["esat","gas-laws","thermodynamics"] },
  ],

  tsa: [
    { id:"tsa_001", q:"'Banning social media for under-16s protects mental health.' The WEAKEST supporting argument is:", opts:["Studies link heavy social media use to teen anxiety","Parents struggle to monitor usage","The same harmful content exists on other platforms","Regulation has worked for alcohol and tobacco"], ans:2, topic:"Argument Analysis", hint:"The weakest support may actually undermine the policy's purpose", difficulty:3, tags:["tsa","argument","policy"] },
    { id:"tsa_002", q:"A coat costs £80 after a 20% discount. Original price?", opts:["£96","£98","£100","£104"], ans:2, topic:"Numerical Reasoning", hint:"80 = original × 0.80. Divide both sides by 0.80.", difficulty:1, tags:["tsa","numerical","reverse-percentage"] },
    { id:"tsa_003", q:"'Economic growth always improves wellbeing.' Which evidence MOST undermines this?", opts:["GDP grew 3% last year","Inequality widened despite growth","Inflation remained low","Unemployment fell"], ans:1, topic:"Argument Evaluation", hint:"Wellbeing depends on distribution — aggregate growth can mask worsening inequality", difficulty:3, tags:["tsa","economics","wellbeing"] },
  ],

  step: [
    { id:"step_001", q:"Prove n² + n is always even. Which approach is most elegant?", opts:["n²+n = n(n+1); consecutive integers, one must be even","Expand to show n² is always even","Assume n is even and n is odd separately","Use modular arithmetic mod 4"], ans:0, topic:"Proof", hint:"Factor the expression first. What property do consecutive integers always have?", difficulty:2, tags:["step","proof","number-theory"] },
    { id:"step_002", q:"y = x³ − 6x² + 9x. Number of stationary points?", opts:["0","1","2","3"], ans:2, topic:"Calculus", hint:"dy/dx = 3x² − 12x + 9. Set to zero and solve. Check discriminant.", difficulty:2, tags:["step","calculus","stationary-points"] },
    { id:"step_003", q:"log₂(x) + log₂(x−2) = 3. Find x.", opts:["4","3+√17","4 only (after checking domain)","No real solution"], ans:2, topic:"Logarithms", hint:"Combine: log₂(x(x−2)) = 3 → x(x−2) = 8. Solve quadratic, reject x < 0.", difficulty:3, tags:["step","logarithms","domain"] },
    { id:"step_004", q:"∫(2x + 3)dx from 1 to 4 = ?", opts:["18","21","24","27"], ans:1, topic:"Integration", hint:"Integrate to get [x² + 3x]. Evaluate at 4 and subtract value at 1.", difficulty:2, tags:["step","integration","definite"] },
  ],
}

// ── Helper: get questions for a subject ──────────────────────────────────────

export function getQuestions(stream, subject) {
  const bank = stream === 'gcse' ? GCSE : ALEVEL
  return bank[subject] ?? []
}

// ── All subjects metadata ─────────────────────────────────────────────────────

export const STREAM_CONFIG = {
  gcse: {
    label: 'GCSE Track',
    years: 'Years 8–10',
    subjects: [
      { id:'maths',   label:'Maths',   emoji:'📐', desc:'Algebra, Geometry, Stats' },
      { id:'english', label:'English', emoji:'📚', desc:'Comprehension, Grammar' },
      { id:'science', label:'Science', emoji:'🔬', desc:'Physics, Chemistry, Biology' },
      { id:'verbal',  label:'Verbal',  emoji:'🧩', desc:'Reasoning & Vocabulary' },
    ],
  },
  alevel: {
    label: 'A-Level Track',
    years: 'Years 11–12',
    subjects: [
      { id:'ucat',  label:'UCAT',       emoji:'🏥', desc:'Medicine & Dentistry' },
      { id:'lnat',  label:'LNAT',       emoji:'⚖️',  desc:'Law — Critical Thinking' },
      { id:'tmua',  label:'TMUA / MAT', emoji:'∑',   desc:'Maths & CS' },
      { id:'esat',  label:'ESAT',       emoji:'⚗️',  desc:'Engineering & Sciences' },
      { id:'tsa',   label:'TSA',        emoji:'🧠', desc:'PPE, Economics, Philosophy' },
      { id:'step',  label:'STEP',       emoji:'📏', desc:'Cambridge Mathematics' },
    ],
  },
}
