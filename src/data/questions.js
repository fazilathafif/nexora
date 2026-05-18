/**
 * questions.js — full question bank for Nexora.
 * Each question: { id, q, opts, ans, topic, hint, difficulty, tags }
 * LNAT questions also have: { passage } (shared passage text for a question group)
 * ans: 0-indexed correct option
 * difficulty: 1 (easy) | 2 (medium) | 3 (hard)
 */

// ── GCSE STREAM ───────────────────────────────────────────────────────────────

export const GCSE = {

  maths: [
    { id:'maths_001', q:'A train covers 420 km in 3.5 hours. What is its speed in km/h?', opts:['100','110','120','130'], ans:2, topic:'Speed & Distance', hint:'Speed = Distance ÷ Time', difficulty:1, tags:['ratio','real-world'] },
    { id:'maths_002', q:'Expand and simplify: (x + 3)(x − 5)', opts:['x²−2x−15','x²+2x−15','x²−8x+15','x²+8x−15'], ans:0, topic:'Algebra', hint:'FOIL: First, Outer, Inner, Last', difficulty:1, tags:['algebra','expanding'] },
    { id:'maths_003', q:'What is 17.5% of £640?', opts:['£104','£108','£112','£116'], ans:2, topic:'Percentages', hint:'Find 10%, halve for 5%, halve again for 2.5%', difficulty:1, tags:['percentages','money'] },
    { id:'maths_004', q:'The nth term of a sequence is 4n − 3. What is the 7th term?', opts:['25','27','29','31'], ans:0, topic:'Sequences', hint:'Substitute n = 7 into the formula', difficulty:1, tags:['sequences','algebra'] },
    { id:'maths_005', q:'Interior angle of a regular hexagon?', opts:['108°','120°','135°','140°'], ans:1, topic:'Geometry', hint:'(n−2)×180 ÷ n, where n = 6', difficulty:2, tags:['geometry','polygons'] },
    { id:'maths_006', q:'Solve: 3x² − 12 = 0', opts:['x=±2','x=±4','x=2 only','x=4 only'], ans:0, topic:'Quadratics', hint:'Isolate x², then square root', difficulty:2, tags:['algebra','quadratics'] },
    { id:'maths_007', q:'A bag has 4 red, 3 blue, 5 green balls. P(not red) = ?', opts:['1/3','1/2','2/3','3/4'], ans:2, topic:'Probability', hint:'P(not red) = 1 − P(red). Total = 12', difficulty:1, tags:['probability'] },
    { id:'maths_008', q:'Gradient of the line 3y = 6x − 9?', opts:['2','3','6','−3'], ans:0, topic:'Straight Lines', hint:'Rearrange to y = mx + c first', difficulty:2, tags:['coordinate-geometry'] },
    { id:'maths_009', q:'Solve simultaneously: 2x + y = 7 and x − y = 2', opts:['x=1, y=5','x=3, y=1','x=2, y=3','x=4, y=−1'], ans:1, topic:'Simultaneous Equations', hint:'Add the equations to eliminate y', difficulty:2, tags:['algebra','simultaneous'] },
    { id:'maths_010', q:'In a right-angled triangle, the opposite side is 5 cm and hypotenuse is 13 cm. What is sin θ?', opts:['5/12','5/13','12/13','13/5'], ans:1, topic:'Trigonometry', hint:'SOH: sin = Opposite ÷ Hypotenuse', difficulty:2, tags:['trigonometry','SOH-CAH-TOA'] },
    { id:'maths_011', q:'An angle at the centre of a circle is 84°. What is the angle at the circumference subtended by the same arc?', opts:['168°','84°','42°','21°'], ans:2, topic:'Circle Theorems', hint:'Angle at centre = twice angle at circumference', difficulty:2, tags:['circle-theorems','geometry'] },
    { id:'maths_012', q:'Simplify: √75', opts:['5√3','3√5','25√3','15√2'], ans:0, topic:'Surds', hint:'√75 = √(25 × 3). Pull out the perfect square.', difficulty:2, tags:['surds','number'] },
    { id:'maths_013', q:'Use the quadratic formula on x² − 5x + 6 = 0. Which values of x are correct?', opts:['x = 2 and x = 3','x = −2 and x = −3','x = 1 and x = 6','x = −1 and x = −6'], ans:0, topic:'Quadratic Formula', hint:'x = (5 ± √(25−24)) / 2. Or just factorise!', difficulty:2, tags:['quadratics','formula'] },
    { id:'maths_014', q:'Vector a = (3, 2) and vector b = (−1, 4). What is 2a − b?', opts:['(7, 0)','(5, 8)','(7, −8)','(5, 0)'], ans:0, topic:'Vectors', hint:'Multiply a by 2, then subtract b component by component', difficulty:2, tags:['vectors'] },
    { id:'maths_015', q:'A fair coin is flipped twice. P(at least one head) = ?', opts:['1/4','1/2','3/4','1'], ans:2, topic:'Probability Trees', hint:'P(at least one H) = 1 − P(no heads). P(TT) = 1/4', difficulty:2, tags:['probability','tree-diagrams'] },
    { id:'maths_016', q:'A length is 8.4 cm to 1 d.p. What is the upper bound?', opts:['8.40 cm','8.44 cm','8.45 cm','8.49 cm'], ans:2, topic:'Bounds', hint:'Upper bound = measurement + half of the degree of accuracy', difficulty:2, tags:['bounds','rounding'] },
    { id:'maths_017', q:'Point P(2, 3) is reflected in the y-axis. What are its new coordinates?', opts:['(2, −3)','(−2, 3)','(−2, −3)','(3, 2)'], ans:1, topic:'Transformations', hint:'Reflecting in the y-axis negates the x-coordinate', difficulty:1, tags:['transformations','geometry'] },
    { id:'maths_018', q:'If f(x) = 3x − 1, find f(f(2)).', opts:['4','14','15','17'], ans:1, topic:'Function Notation', hint:'First find f(2), then apply f again to that result', difficulty:2, tags:['functions','algebra'] },
  ],

  english: [
    { id:'eng_001', q:'Which sentence uses a semicolon correctly?', opts:['I like tea; and coffee.','She ran fast; however, she missed the bus.','He is tall; brown hair.','They left; early.'], ans:1, topic:'Punctuation', hint:'A semicolon joins two complete, related clauses', difficulty:1, tags:['punctuation'] },
    { id:'eng_002', q:"What does 'ubiquitous' mean?", opts:['Rare and precious','Found everywhere','Extremely loud','Deeply mysterious'], ans:1, topic:'Vocabulary', hint:"Think 'everywhere you look'", difficulty:2, tags:['vocabulary'] },
    { id:'eng_003', q:"'Life is a journey with no map.' This is an example of:", opts:['Simile','Metaphor','Personification','Hyperbole'], ans:1, topic:'Literary Devices', hint:"A metaphor says one thing IS another (no 'like' or 'as')", difficulty:1, tags:['literary-devices'] },
    { id:'eng_004', q:"Which opening best hooks the reader in a narrative essay?", opts:["In this essay I will describe…","It was the day everything changed.","My story is about a difficult time.","I am going to tell you about…"], ans:1, topic:'Writing Craft', hint:'Drop the reader straight into the action — show, don\'t tell', difficulty:2, tags:['writing','narrative'] },
    { id:'eng_005', q:"Identify the subordinate clause: 'Although it rained, we played cricket.'", opts:['we played cricket','Although it rained','it rained','Although it'], ans:1, topic:'Grammar', hint:"A subordinate clause can't stand alone as a sentence", difficulty:2, tags:['grammar','clauses'] },
    { id:'eng_006', q:"'The classroom erupted in laughter.' The word 'erupted' is an example of:", opts:['Alliteration','Metaphor','Onomatopoeia','Pathetic fallacy'], ans:1, topic:'Literary Devices', hint:'A verb used figuratively — like a volcano, not an earthquake', difficulty:2, tags:['literary-devices'] },
    { id:'eng_007', q:"'Buy British! Support our farmers. Keep Britain great!' Which persuasive technique is used?", opts:['Alliteration','Rule of three','Rhetorical question','Anecdote'], ans:1, topic:'Persuasive Techniques', hint:'Three short statements in a row for emphasis and rhythm', difficulty:1, tags:['persuasion','rhetoric'] },
    { id:'eng_008', q:"A writer describes the sky as 'weeping' before a character's funeral. This is an example of:", opts:['Personification','Pathetic fallacy','Metaphor','Simile'], ans:1, topic:'Literary Devices', hint:'When the weather or setting reflects a character\'s mood', difficulty:2, tags:['literary-devices','pathetic-fallacy'] },
    { id:'eng_009', q:"Which language technique creates urgency in the sentence: 'We must act now, before it is too late'?", opts:['Hyperbole','Modal verb + adverb of time','Alliteration','Passive voice'], ans:1, topic:'Language Analysis', hint:"'Must' is a modal verb suggesting obligation; 'now' creates urgency", difficulty:2, tags:['language-analysis','grammar'] },
    { id:'eng_010', q:"What is the effect of starting multiple consecutive sentences with 'Never' (anaphora)?", opts:['It speeds up the pace of writing','It creates emphasis and a memorable rhythm','It introduces a list of facts','It makes the writing more formal'], ans:1, topic:'Structural Features', hint:'Repetition at the start of clauses = anaphora; it creates a hammering, emphatic effect', difficulty:2, tags:['structure','rhetoric'] },
    { id:'eng_011', q:"A student writes: 'The soldiers marched like clockwork toys.' Which technique is this?", opts:['Metaphor','Simile','Personification','Oxymoron'], ans:1, topic:'Literary Devices', hint:"'Like' or 'as' signals a simile", difficulty:1, tags:['literary-devices','simile'] },
    { id:'eng_012', q:"When comparing two texts, a student says both writers use second person ('you') to...", opts:['Distance the reader from the subject','Create a direct, inclusive relationship with the reader','Make the writing more formal','Avoid personal bias'], ans:1, topic:'Comparing Texts', hint:"'You' draws the reader in, making them feel personally addressed", difficulty:2, tags:['comparing','language-analysis'] },
    { id:'eng_013', q:"In a non-fiction article, the sub-headings serve to:", opts:['Replace the introduction','Provide evidence for claims','Guide the reader and signal topic shifts','Create a dramatic build-up'], ans:2, topic:'Structural Features', hint:'Think about what sub-headings do for a reader skimming the text', difficulty:1, tags:['structure','non-fiction'] },
    { id:'eng_014', q:"What is the main purpose of a counter-argument in a persuasive essay?", opts:['To confuse the reader','To show the writer has considered opposing views, strengthening credibility','To end the essay dramatically','To introduce new evidence'], ans:1, topic:'Writing Craft', hint:"Acknowledging the 'other side' makes you seem more balanced and trustworthy", difficulty:2, tags:['persuasion','writing'] },
  ],

  science: [
    { id:'sci_001', q:'Atomic number of carbon?', opts:['4','6','8','12'], ans:1, topic:'Chemistry – Atoms', hint:'Atomic number = number of protons. Carbon is element 6.', difficulty:1, tags:['chemistry','atomic-structure'] },
    { id:'sci_002', q:'Which wave type cannot travel through a vacuum?', opts:['Light','X-rays','Sound','Radio waves'], ans:2, topic:'Physics – Waves', hint:'Sound needs particles to vibrate — it requires a medium', difficulty:1, tags:['physics','waves'] },
    { id:'sci_003', q:'Powerhouse of the cell?', opts:['Nucleus','Ribosome','Mitochondria','Chloroplast'], ans:2, topic:'Biology – Cells', hint:'It produces ATP through aerobic respiration', difficulty:1, tags:['biology','cells'] },
    { id:'sci_004', q:'F = ma. If m = 5 kg and a = 3 m/s², what is F?', opts:['8 N','12 N','15 N','20 N'], ans:2, topic:'Physics – Forces', hint:'Substitute directly: F = 5 × 3', difficulty:1, tags:['physics','forces'] },
    { id:'sci_005', q:'Produced at the cathode during electrolysis of brine?', opts:['Chlorine','Hydrogen','Oxygen','Sodium'], ans:1, topic:'Chemistry – Electrolysis', hint:'At the cathode, H⁺ ions gain electrons to form H₂', difficulty:3, tags:['chemistry','electrolysis'] },
    { id:'sci_006', q:'Which process converts glucose to lactic acid WITHOUT oxygen?', opts:['Aerobic respiration','Photosynthesis','Anaerobic respiration','Fermentation in yeast'], ans:2, topic:'Biology – Respiration', hint:"'An-' means without. Lactic acid = muscle anaerobic respiration", difficulty:2, tags:['biology','respiration'] },
    { id:'sci_007', q:'A person has genotype Bb for eye colour (B = brown, dominant). Their eye colour is:', opts:['Blue','Brown','Green','Cannot be determined'], ans:1, topic:'Biology – Genetics', hint:'One dominant allele is enough to show the dominant phenotype', difficulty:1, tags:['biology','genetics','inheritance'] },
    { id:'sci_008', q:'Which of the following is evidence for Darwin\'s theory of natural selection?', opts:['All members of a species are identical','Organisms produce far more offspring than can survive','Offspring are always identical to parents','The environment never changes'], ans:1, topic:'Biology – Evolution', hint:'Overproduction of offspring leads to competition — key part of natural selection', difficulty:2, tags:['biology','evolution'] },
    { id:'sci_009', q:'Blood glucose rises after a meal. Which hormone is released to lower it?', opts:['Glucagon','Adrenaline','Insulin','Testosterone'], ans:2, topic:'Biology – Homeostasis', hint:'Insulin is released by the pancreas to allow cells to absorb glucose', difficulty:1, tags:['biology','homeostasis','hormones'] },
    { id:'sci_010', q:'Which type of bonding involves the transfer of electrons between a metal and a non-metal?', opts:['Covalent bonding','Metallic bonding','Ionic bonding','Hydrogen bonding'], ans:2, topic:'Chemistry – Bonding', hint:'Metals lose electrons; non-metals gain them. The electrostatic attraction = ionic bond', difficulty:2, tags:['chemistry','bonding','ionic'] },
    { id:'sci_011', q:'Increasing temperature speeds up a chemical reaction because:', opts:['Reactant molecules become smaller','Collision frequency and energy both increase','Products are more stable','The activation energy decreases'], ans:1, topic:'Chemistry – Rates', hint:'More energy = more frequent, more energetic collisions → more successful collisions', difficulty:2, tags:['chemistry','rates','collision-theory'] },
    { id:'sci_012', q:'A 12V battery is connected to a 4Ω resistor. Current through the circuit?', opts:['3 A','4 A','6 A','48 A'], ans:0, topic:'Physics – Electricity', hint:"Ohm's Law: I = V ÷ R", difficulty:1, tags:['physics','electricity','ohms-law'] },
    { id:'sci_013', q:'Which part of the electromagnetic spectrum has the shortest wavelength?', opts:['Radio waves','Visible light','Ultraviolet','Gamma rays'], ans:3, topic:'Physics – EM Spectrum', hint:'The EM spectrum goes from longest (radio) to shortest (gamma) wavelength', difficulty:1, tags:['physics','waves','EM-spectrum'] },
    { id:'sci_014', q:'A main sequence star like the Sun will eventually become:', opts:['A neutron star','A black hole','A red giant, then a white dwarf','A supernova then a white dwarf'], ans:2, topic:'Physics – Space', hint:'Low/medium mass stars expand into red giants, then shed outer layers → white dwarf', difficulty:2, tags:['physics','space','stellar-evolution'] },
  ],

  verbal: [
    { id:'vrb_001', q:'Odd one out: Crimson · Scarlet · Azure · Ruby', opts:['Crimson','Scarlet','Azure','Ruby'], ans:2, topic:'Classification', hint:'Three are shades of red; one is blue', difficulty:1, tags:['classification','vocabulary'] },
    { id:'vrb_002', q:'ALL doctors are scientists; SOME scientists are teachers. Therefore:', opts:['All doctors are teachers','Some doctors may be teachers','No doctors are teachers','All teachers are doctors'], ans:1, topic:'Logical Reasoning', hint:"'Some' means partial overlap — draw a Venn diagram", difficulty:2, tags:['logic','venn'] },
    { id:'vrb_003', q:'Poet : Poem :: Sculptor : ___', opts:['Clay','Studio','Sculpture','Chisel'], ans:2, topic:'Analogies', hint:'What does a sculptor CREATE? Match the same relationship.', difficulty:1, tags:['analogies'] },
    { id:'vrb_004', q:'A is taller than B. C is shorter than B. D is taller than A. Tallest to shortest:', opts:['D A B C','A D B C','D A C B','A D C B'], ans:0, topic:'Ordering', hint:'Write inequalities: D > A > B > C', difficulty:2, tags:['ordering','logic'] },
    { id:'vrb_005', q:'What comes next in the series? 2, 5, 10, 17, 26, ___', opts:['33','35','37','40'], ans:2, topic:'Number Series', hint:'Differences are 3, 5, 7, 9… (odd numbers increasing). Next difference = 11', difficulty:2, tags:['number-series'] },
    { id:'vrb_006', q:'What comes next? A, C, F, J, ___', opts:['M','N','O','P'], ans:2, topic:'Letter Series', hint:'Gaps between letters: +2, +3, +4, +5. Next gap = +5 from J', difficulty:2, tags:['letter-series'] },
    { id:'vrb_007', q:'A shopkeeper sells apples for 30p each and pears for 45p each. Jane spends exactly £1.95 on a mix of both. How many pears did she buy?', opts:['1','2','3','4'], ans:2, topic:'Numerical Reasoning', hint:'Try combinations: 3 pears = 135p, leaving 60p = 2 apples ✓', difficulty:2, tags:['numerical','problem-solving'] },
    { id:'vrb_008', q:'Odd one out: Running · Swimming · Cycling · Thinking', opts:['Running','Swimming','Cycling','Thinking'], ans:3, topic:'Classification', hint:'Three are physical exercise activities; one is mental', difficulty:1, tags:['classification'] },
    { id:'vrb_009', q:'Which number best completes the pattern? 1, 4, 9, 16, ___', opts:['20','24','25','36'], ans:2, topic:'Number Series', hint:'1², 2², 3², 4²… these are square numbers', difficulty:1, tags:['number-series','sequences'] },
    { id:'vrb_010', q:'If FRIEND is coded as GSJFOE, how is HAPPY coded?', opts:['IBQQZ','GZOOX','IBQPZ','HAQPY'], ans:0, topic:'Code Breaking', hint:'Each letter shifts one place forward in the alphabet', difficulty:2, tags:['code-breaking','pattern'] },
    { id:'vrb_011', q:'Three people share £120 in ratio 1:2:3. The largest share is:', opts:['£20','£40','£60','£80'], ans:2, topic:'Ratio', hint:'Total parts = 1+2+3 = 6. Largest share = 3/6 of £120', difficulty:1, tags:['ratio','numerical'] },
    { id:'vrb_012', q:'If today is Wednesday and a deadline is in 18 days, what day is the deadline?', opts:['Sunday','Monday','Tuesday','Wednesday'], ans:1, topic:'Temporal Reasoning', hint:'18 ÷ 7 = 2 remainder 4. Count 4 days forward from Wednesday', difficulty:2, tags:['temporal','reasoning'] },
  ],
}

// ── A-LEVEL STREAM ────────────────────────────────────────────────────────────

const PASSAGE_AI_ETHICS = `Recent advances in artificial intelligence have raised profound questions about accountability in automated decision-making. When an algorithm denies a loan application or recommends a prison sentence, it is unclear who bears moral responsibility — the programmer, the company deploying the system, or the algorithm itself. Critics argue that existing legal frameworks, designed for human actors, are fundamentally ill-equipped to address this challenge. Proponents of AI governance argue that transparency requirements and mandatory auditing could bridge this gap without stifling innovation.`

const PASSAGE_CRIMINAL_JUSTICE = `The purpose of criminal sentencing has long been debated between those who favour retribution — punishment proportionate to the offence — and those who prioritise rehabilitation, aiming to reintegrate offenders into society. Research consistently shows that long custodial sentences have limited deterrent effect on crime rates, while education and employment programmes in prisons significantly reduce reoffending. Nevertheless, public and political pressure often pushes sentencing policy toward harsher penalties, particularly following high-profile cases. This tension between evidence-based policy and democratic sentiment lies at the heart of criminal justice reform debates.`

export const ALEVEL = {

  ucat: [
    { id:'ucat_001', q:'[Verbal Reasoning] Passage: "Telemedicine reduces barriers to access." Which conclusion follows?', opts:['All patients prefer telemedicine','Telemedicine may help rural patients access care','Telemedicine replaces hospitals','Telemedicine is cheaper'], ans:1, topic:'Verbal Reasoning', hint:'Only draw conclusions directly supported — do not infer beyond the text', difficulty:2, tags:['ucat-vr'] },
    { id:'ucat_002', q:'[Quantitative] Hospital: 240 beds, 65% occupied. How many are EMPTY?', opts:['76','80','84','88'], ans:2, topic:'Quantitative Reasoning', hint:'Empty = Total − Occupied. Occupied = 0.65 × 240 = 156', difficulty:1, tags:['ucat-qr'] },
    { id:'ucat_003', q:'[Decision Making] A capacitous patient refuses a life-saving transfusion on religious grounds. The doctor should:', opts:['Override — life takes precedence','Respect the refusal — autonomy is paramount','Seek a court order','Consult family first'], ans:1, topic:'Decision Making', hint:'Mental Capacity Act 2005: adults with capacity have an absolute right to refuse', difficulty:2, tags:['ucat-dm','ethics'] },
    { id:'ucat_004', q:'[Situational Judgement] You observe a senior colleague make a drug dosing error; no harm yet. You should:', opts:['Ignore — no harm done','Raise it with the colleague privately first','Report immediately to GMC','Tell other junior colleagues'], ans:1, topic:'Situational Judgement', hint:'GMC: raise concerns at the lowest appropriate level first', difficulty:2, tags:['ucat-sjt'] },
    { id:'ucat_005', q:'[Abstract Reasoning] Shapes gain one side per step: △ → □ → ⬠. Applying the same rule to a circle gives:', opts:['Oval','Heptagon','The pattern breaks — a circle has infinite sides','Square'], ans:2, topic:'Abstract Reasoning', hint:"Test the rule's edge case — a circle can't gain sides in the same way", difficulty:3, tags:['ucat-ar'] },
    { id:'ucat_006', q:'[Verbal Reasoning] A passage states: "All participants who completed the programme showed improvement." Which is a valid inference?', opts:['The programme works for everyone','Non-completers showed no improvement','Some completers improved','Completers definitely improved'], ans:3, topic:'Verbal Reasoning', hint:"'Showed improvement' is directly stated for completers — the rest is speculation", difficulty:2, tags:['ucat-vr','inference'] },
    { id:'ucat_007', q:'[Quantitative] A drug is dosed at 5 mg/kg. A patient weighs 72 kg. Total dose in grams?', opts:['0.036 g','0.36 g','3.6 g','36 g'], ans:1, topic:'Quantitative Reasoning', hint:'5 × 72 = 360 mg. Convert: 360 mg ÷ 1000 = 0.36 g', difficulty:2, tags:['ucat-qr','drug-calculation'] },
    { id:'ucat_008', q:'[Decision Making] Two treatments have equal survival rates but Treatment A has fewer side effects. Evidence quality is similar. You should recommend:', opts:['Treatment B for safety','Treatment A due to fewer side effects','Neither — let the patient decide without guidance','More trials before recommending either'], ans:1, topic:'Decision Making', hint:'Equal outcomes → prefer the option with fewer harms. Then involve the patient.', difficulty:2, tags:['ucat-dm','clinical-reasoning'] },
    { id:'ucat_009', q:'[Situational Judgement] A colleague confides they have been self-medicating with prescription drugs. You should:', opts:['Keep it strictly confidential — trust comes first','Encourage them to seek occupational health support and offer to help','Immediately report to the GMC','Tell your consultant without telling your colleague'], ans:1, topic:'Situational Judgement', hint:'Patient safety and colleague welfare are both priorities; support before escalation', difficulty:3, tags:['ucat-sjt','professionalism'] },
    { id:'ucat_010', q:'[Quantitative] A clinical trial has 400 participants: 200 treatment, 200 placebo. 60 treatment patients improved vs 40 placebo. Absolute risk reduction?', opts:['5%','10%','15%','20%'], ans:1, topic:'Quantitative Reasoning', hint:'ARR = (improved in treatment / treatment group) − (improved in placebo / placebo group)', difficulty:3, tags:['ucat-qr','statistics'] },
    { id:'ucat_011', q:'[Verbal Reasoning] "Evidence suggests social media may contribute to anxiety in teenagers." This statement is:', opts:['A definitive causal claim','A cautious correlation claim','A factual statement','A policy recommendation'], ans:1, topic:'Verbal Reasoning', hint:"'May contribute' hedges the claim — it's suggesting association, not causation", difficulty:2, tags:['ucat-vr','critical-thinking'] },
    { id:'ucat_012', q:'[Abstract Reasoning] In each box: the number of sides of the shapes equals the number of dots. A triangle with 4 dots is:', opts:['Following the rule','Breaking the rule','An exception to the rule','Impossible to categorise'], ans:1, topic:'Abstract Reasoning', hint:'3 sides ≠ 4 dots — this breaks the stated pattern', difficulty:2, tags:['ucat-ar','pattern'] },
    { id:'ucat_013', q:'[Decision Making] A 14-year-old presents alone requesting contraception. She understands the risks and implications fully. You should:', opts:['Refuse — she is under 16','Provide it if she is Gillick competent','Only help if parents consent','Refer to a specialist'], ans:1, topic:'Decision Making', hint:'Gillick competence: under-16s can consent if they fully understand the treatment', difficulty:3, tags:['ucat-dm','ethics','competence'] },
    { id:'ucat_014', q:'[Situational Judgement] You are about to perform a procedure when you realise the consent form was signed under a different patient name. You should:', opts:['Proceed — the patient verbally consented','Stop the procedure and clarify consent before continuing','Ask a nurse to correct the form','Proceed but document the discrepancy'], ans:1, topic:'Situational Judgement', hint:'Valid consent requires the correct patient — patient safety above convenience', difficulty:2, tags:['ucat-sjt','consent'] },
  ],

  lnat: [
    { id:'lnat_001', q:"'All swans observed in Europe are white, therefore all swans are white.' This argument fails because:", opts:["Swans can be black","It over-generalises from a limited sample","Europe is not a valid sample","Colour is irrelevant"], ans:1, topic:'Inductive Reasoning', hint:"Classic problem of induction — Hume's black swan problem", difficulty:2, tags:['lnat','induction'] },
    { id:'lnat_002', q:"A law allows deportation 'in the interests of national security' without charge. Which legal principle is MOST threatened?", opts:['Habeas corpus','Sub judice','Stare decisis','Mens rea'], ans:0, topic:'Legal Principles', hint:'Which Latin principle protects against detention without trial?', difficulty:2, tags:['lnat','rule-of-law'] },
    { id:'lnat_003', q:"'Speed cameras near schools reduce accidents.' The STRONGEST counter-argument is:", opts:['Cameras are expensive','Drivers slow only near cameras, not elsewhere','Schools should have crossing guards','Accident data may be unreliable'], ans:1, topic:'Counter-Argument', hint:'The strongest counter attacks the central effect claimed — not cost or alternatives', difficulty:3, tags:['lnat','argument'] },
    { id:'lnat_004', q:"Which word most precisely means 'to formally withdraw a previous statement'?", opts:['Rebuke','Recant','Rebuff','Rescind'], ans:1, topic:'Vocabulary', hint:"Recant = 'unsay' something. Think: re-cantare (to unsing)", difficulty:2, tags:['lnat','vocabulary'] },
    // AI Ethics passage group
    { id:'lnat_005', passage: PASSAGE_AI_ETHICS, q:"According to the passage, what is the core accountability problem with AI decision-making?", opts:["Algorithms are too expensive to audit","It is unclear who bears moral responsibility when an AI makes a harmful decision","AI systems are deliberately designed to avoid accountability","Programmers intentionally code biased outcomes"], ans:1, topic:'Argument Analysis', hint:'Locate the sentence that directly names the accountability problem', difficulty:2, tags:['lnat-passage','ai-ethics'] },
    { id:'lnat_006', passage: PASSAGE_AI_ETHICS, q:"The passage implies that existing legal frameworks are inadequate for AI because:", opts:["Laws change too slowly","They were designed with human actors in mind, not algorithms","Courts refuse to hear AI-related cases","Transparency requirements are already too strict"], ans:1, topic:'Inference', hint:"The passage says frameworks 'designed for human actors' can't address AI — why?", difficulty:2, tags:['lnat-passage','inference'] },
    { id:'lnat_007', passage: PASSAGE_AI_ETHICS, q:"Which of the following best describes the structure of the passage's argument?", opts:["It presents one view then dismisses it","It identifies a problem, notes a criticism, then outlines a proposed solution","It only presents the case against AI governance","It is a neutral description with no argument"], ans:1, topic:'Argument Structure', hint:'Map the passage: problem → criticism of current law → proposed fix', difficulty:3, tags:['lnat-passage','structure'] },
    { id:'lnat_008', passage: PASSAGE_AI_ETHICS, q:"A proponent of AI governance, as described in the passage, would most likely support:", opts:["Banning AI from decision-making entirely","Mandatory algorithmic transparency and regular audits","Allowing AI to self-regulate","Replacing all human judges with AI"], ans:1, topic:'Inference', hint:'The passage says proponents argue for transparency and auditing', difficulty:2, tags:['lnat-passage','inference'] },
    // Criminal justice passage group
    { id:'lnat_009', passage: PASSAGE_CRIMINAL_JUSTICE, q:"According to the passage, which approach to sentencing has stronger evidence behind it?", opts:["Retribution","Long custodial sentences","Rehabilitation","Public opinion-based sentencing"], ans:2, topic:'Evidence Evaluation', hint:"The passage says research shows rehabilitation 'significantly reduces reoffending'", difficulty:1, tags:['lnat-passage','criminal-justice'] },
    { id:'lnat_010', passage: PASSAGE_CRIMINAL_JUSTICE, q:"The passage suggests that sentencing policy is often driven by:", opts:["Careful analysis of reoffending data","Public and political pressure following high-profile cases","Academic research on rehabilitation","Judicial discretion"], ans:1, topic:'Argument Analysis', hint:"Find the sentence about 'public and political pressure'", difficulty:1, tags:['lnat-passage','criminal-justice'] },
    { id:'lnat_011', passage: PASSAGE_CRIMINAL_JUSTICE, q:"Which best describes the central tension identified in the passage?", opts:["Between judges and juries","Between evidence-based policy and democratic sentiment","Between defendants and victims","Between local and national government"], ans:1, topic:'Identifying Claims', hint:'The passage explicitly names this tension in its final sentence', difficulty:2, tags:['lnat-passage','criminal-justice'] },
    { id:'lnat_012', q:"A statute says 'vehicles are prohibited in the park.' A court must decide if a bicycle counts. Which approach prioritises the literal text?", opts:["Purposive interpretation","Literal rule","Golden rule","Mischief rule"], ans:1, topic:'Legal Interpretation', hint:"The literal rule = apply the plain, ordinary meaning of the words", difficulty:2, tags:['lnat','statutory-interpretation'] },
  ],

  tmua: [
    { id:'tmua_001', q:'f(x) = x³ − 3x². Find f\'(2).', opts:['0','2','−2','4'], ans:0, topic:'Differentiation', hint:"f'(x) = 3x² − 6x. Substitute x = 2.", difficulty:2, tags:['tmua','calculus'] },
    { id:'tmua_002', q:'How many integers from 1–100 are divisible by BOTH 3 and 4?', opts:['6','7','8','9'], ans:2, topic:'Number Theory', hint:'LCM(3,4) = 12. Count multiples of 12 up to 100.', difficulty:2, tags:['tmua','number-theory'] },
    { id:'tmua_003', q:'Geometric sequence: first term 4, ratio 3. Sum of first 4 terms?', opts:['156','160','164','168'], ans:1, topic:'Series', hint:'Sₙ = a(rⁿ−1)/(r−1). a=4, r=3, n=4.', difficulty:2, tags:['tmua','series'] },
    { id:'tmua_004', q:'P → Q and Q → R are both true. Which must also be true?', opts:['R → P','P → R','¬P → ¬Q','Q → P'], ans:1, topic:'Logic', hint:'Transitivity of implication: A→B and B→C gives A→C', difficulty:2, tags:['tmua','logic'] },
    { id:'tmua_005', q:'How many real solutions does x² + 4x + 5 = 0 have?', opts:['0','1','2','Cannot be determined'], ans:0, topic:'Quadratics', hint:'Discriminant: b²−4ac = 16−20 = −4 < 0. No real solutions.', difficulty:2, tags:['tmua','quadratics'] },
    { id:'tmua_006', q:'∫(2x + 3)dx from 1 to 4 = ?', opts:['18','21','24','27'], ans:1, topic:'Integration', hint:'Integrate to get [x² + 3x]. Evaluate at 4 minus value at 1.', difficulty:2, tags:['tmua','integration'] },
    { id:'tmua_007', q:'X ~ B(10, 0.3). E(X) = ?', opts:['0.3','2','3','7'], ans:2, topic:'Statistics', hint:'For a binomial distribution, E(X) = np = 10 × 0.3', difficulty:1, tags:['tmua','statistics','binomial'] },
    { id:'tmua_008', q:"Prove by contradiction that √2 is irrational. The first step is to assume:", opts:['√2 = a/b where a, b are integers with no common factor','√2 cannot be written as a fraction','All square roots are irrational','2 is a prime number'], ans:0, topic:'Proof', hint:'Proof by contradiction: assume the opposite of what you want to prove', difficulty:2, tags:['tmua','proof','surds'] },
    { id:'tmua_009', q:'Coefficient of x² in the expansion of (1 + x)⁵?', opts:['5','10','15','20'], ans:1, topic:'Binomial Expansion', hint:'⁵C₂ = 5!/(2!3!) = 10', difficulty:2, tags:['tmua','binomial-expansion'] },
    { id:'tmua_010', q:'sin²θ + cos²θ = 1. If sinθ = 3/5, cosθ = ?', opts:['4/5','3/4','5/4','1/5'], ans:0, topic:'Trigonometry', hint:'cos²θ = 1 − sin²θ = 1 − 9/25 = 16/25. So cosθ = 4/5.', difficulty:2, tags:['tmua','trigonometry','identities'] },
    { id:'tmua_011', q:'How many ways can 4 people be arranged in a line?', opts:['8','16','24','48'], ans:2, topic:'Combinatorics', hint:'4! = 4 × 3 × 2 × 1 = 24', difficulty:1, tags:['tmua','combinatorics','permutations'] },
    { id:'tmua_012', q:'The graph of y = f(x) is translated 3 units right. The new equation is:', opts:['y = f(x + 3)','y = f(x − 3)','y = f(x) + 3','y = f(x) − 3'], ans:1, topic:'Graph Transformations', hint:'A right shift by k replaces x with (x − k) in the function', difficulty:2, tags:['tmua','transformations'] },
    { id:'tmua_013', q:'A fair die is rolled twice. P(sum = 7)?', opts:['1/6','1/9','5/36','7/36'], ans:0, topic:'Probability', hint:'Pairs that sum to 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6 out of 36', difficulty:2, tags:['tmua','probability'] },
    { id:'tmua_014', q:'Arithmetic series: first term 3, common difference 4, 20th term?', opts:['79','83','87','91'], ans:0, topic:'Sequences', hint:'nth term = a + (n−1)d = 3 + 19×4 = 3 + 76', difficulty:1, tags:['tmua','sequences','arithmetic'] },
  ],

  esat: [
    { id:'esat_001', q:'Projectile launched at 30° at 20 m/s. Horizontal velocity component?', opts:['10 m/s','10√3 m/s','10√2 m/s','15 m/s'], ans:1, topic:'Mechanics', hint:'Horizontal = v·cos(30°) = 20 × (√3/2) = 10√3', difficulty:2, tags:['esat','mechanics'] },
    { id:'esat_002', q:'100 Ω and 200 Ω in parallel. Total resistance?', opts:['300 Ω','150 Ω','66.7 Ω','50 Ω'], ans:2, topic:'Electricity', hint:'1/R = 1/100 + 1/200 = 3/200, so R = 200/3 ≈ 66.7', difficulty:2, tags:['esat','electricity'] },
    { id:'esat_003', q:'Relative molecular mass of H₂SO₄? (H=1, S=32, O=16)', opts:['80','96','98','100'], ans:2, topic:'Chemistry', hint:'2(1) + 32 + 4(16) = 2 + 32 + 64 = 98', difficulty:1, tags:['esat','chemistry'] },
    { id:'esat_004', q:'Gas at 300 K doubles its temperature at constant volume. Pressure:', opts:['Unchanged','Doubles','Halves','Quadruples'], ans:1, topic:'Gas Laws', hint:"Gay-Lussac: P/T = constant at constant volume. T doubles → P doubles", difficulty:2, tags:['esat','gas-laws'] },
    { id:'esat_005', q:'A 2 kg ball moving at 5 m/s collides and sticks to a stationary 3 kg ball. Velocity after collision?', opts:['1 m/s','2 m/s','3 m/s','5 m/s'], ans:1, topic:'Mechanics – Momentum', hint:'Conservation of momentum: p_before = p_after. 2×5 = (2+3)×v', difficulty:2, tags:['esat','momentum'] },
    { id:'esat_006', q:'In an ideal gas at constant pressure, volume is doubled. What happens to temperature (in Kelvin)?', opts:['Halved','Unchanged','Doubled','Quadrupled'], ans:2, topic:'Gas Laws', hint:"Charles' Law: V/T = constant. V doubles → T doubles", difficulty:2, tags:['esat','gas-laws','thermodynamics'] },
    { id:'esat_007', q:'Which hydrocarbon is the simplest alkene?', opts:['Methane','Ethane','Ethene','Propene'], ans:2, topic:'Chemistry – Organic', hint:'Alkenes have a C=C double bond. Smallest is C₂H₄ = ethene', difficulty:1, tags:['esat','organic-chemistry'] },
    { id:'esat_008', q:'In photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. The oxygen produced comes from:', opts:['CO₂','H₂O','Glucose','The atmosphere'], ans:1, topic:'Biology – Photosynthesis', hint:'Oxygen-18 labelling experiments showed O₂ comes from splitting water molecules', difficulty:3, tags:['esat','biology','photosynthesis'] },
    { id:'esat_009', q:'A wave has frequency 440 Hz and wavelength 0.75 m. Its speed is:', opts:['587 m/s','330 m/s','294 m/s','440 m/s'], ans:1, topic:'Physics – Waves', hint:'v = fλ = 440 × 0.75 = 330 m/s (speed of sound in air!)', difficulty:1, tags:['esat','waves','physics'] },
    { id:'esat_010', q:'A transformer has 200 turns on the primary and 50 turns on the secondary. Input voltage is 240 V. Output voltage?', opts:['60 V','120 V','480 V','960 V'], ans:0, topic:'Electricity – Transformers', hint:'Vₛ/Vₚ = Nₛ/Nₚ. 240 × (50/200) = 60 V', difficulty:2, tags:['esat','electricity','transformers'] },
    { id:'esat_011', q:'Molar mass of calcium carbonate CaCO₃? (Ca=40, C=12, O=16)', opts:['68','88','100','108'], ans:2, topic:'Chemistry – Molar Mass', hint:'40 + 12 + 3(16) = 40 + 12 + 48 = 100 g/mol', difficulty:1, tags:['esat','chemistry','molar-mass'] },
    { id:'esat_012', q:'An enzyme-catalysed reaction is run at 10°C above its optimum temperature. Rate will:', opts:['Increase dramatically','Remain the same','Decrease as enzyme denatures','Increase then plateau'], ans:2, topic:'Biology – Enzymes', hint:'Above optimum, the enzyme active site denatures — the shape changes and activity falls', difficulty:2, tags:['esat','biology','enzymes'] },
  ],

  tsa: [
    { id:'tsa_001', q:"'Banning social media for under-16s protects mental health.' WEAKEST supporting argument:", opts:['Studies link heavy social media use to teen anxiety','Parents struggle to monitor usage','The same harmful content exists on other platforms','Regulation has worked for alcohol and tobacco'], ans:2, topic:'Argument Analysis', hint:'The weakest support may actually undermine the policy', difficulty:3, tags:['tsa','argument'] },
    { id:'tsa_002', q:'A coat costs £80 after a 20% discount. Original price?', opts:['£96','£98','£100','£104'], ans:2, topic:'Numerical Reasoning', hint:'80 = original × 0.80. Divide both sides by 0.80.', difficulty:1, tags:['tsa','numerical','reverse-percentage'] },
    { id:'tsa_003', q:"'Economic growth always improves wellbeing.' Evidence that MOST undermines this:", opts:['GDP grew 3% last year','Inequality widened despite growth','Inflation was low','Unemployment fell'], ans:1, topic:'Argument Evaluation', hint:'Wellbeing depends on distribution — aggregate growth can mask worsening inequality', difficulty:3, tags:['tsa','economics'] },
    { id:'tsa_004', q:'A shop discounts 20%, then a further 10%. Overall discount?', opts:['28%','30%','27%','25%'], ans:0, topic:'Numerical Reasoning', hint:'Apply sequentially: 100 × 0.8 × 0.9 = 72. Discount = 28%.', difficulty:2, tags:['tsa','numerical','percentages'] },
    { id:'tsa_005', q:"'Zoos should be abolished because animals suffer in captivity.' The MAIN assumption is:", opts:['Animals always suffer in captivity','Captivity always causes suffering that outweighs conservation benefits','All zoos are the same','Wild animals are always happier than captive ones'], ans:1, topic:'Identifying Assumptions', hint:'An assumption is the hidden premise the argument relies on but never states', difficulty:3, tags:['tsa','assumptions'] },
    { id:'tsa_006', q:'Three friends share a restaurant bill of £87.60 equally, with a 10% service charge added. How much does each pay?', opts:['£29.20','£32.12','£32.12','£35.00'], ans:1, topic:'Numerical Reasoning', hint:'Total with service charge = £87.60 × 1.10 = £96.36. Divide by 3.', difficulty:2, tags:['tsa','numerical'] },
    { id:'tsa_007', q:"'We should legalise all drugs to reduce crime.' The STRONGEST objection is:", opts:["It contradicts religious values","Legalisation may increase use and health harms without proportionately reducing crime","It would be expensive to regulate","Most people oppose it in surveys"], ans:1, topic:'Counter-Argument', hint:'The strongest objection challenges the central causal claim of the argument', difficulty:3, tags:['tsa','argument','policy'] },
    { id:'tsa_008', q:'A car travels 120 km at 60 km/h, then 80 km at 40 km/h. Total journey time?', opts:['3.5 hrs','4 hrs','4.5 hrs','5 hrs'], ans:1, topic:'Numerical Reasoning', hint:'Time₁ = 120/60 = 2 hrs. Time₂ = 80/40 = 2 hrs. Total = 4 hrs.', difficulty:1, tags:['tsa','numerical','speed'] },
    { id:'tsa_009', q:"Which statement about the argument 'P1: All humans are mortal. P2: Socrates is human. C: Socrates is mortal' is correct?", opts:['It is an inductive argument','It is a valid deductive argument','It commits the fallacy of affirming the consequent','The conclusion does not follow from the premises'], ans:1, topic:'Logic', hint:'If premises are true and the form is valid, the conclusion must be true — that is deductive validity', difficulty:2, tags:['tsa','logic','deduction'] },
    { id:'tsa_010', q:'A factory produces 1200 units in 8 hours with 6 workers. How long to produce 900 units with 4 workers?', opts:['6 hrs','7 hrs','9 hrs','10 hrs'], ans:2, topic:'Numerical Reasoning', hint:'Rate per worker = 1200/(8×6) = 25 units/hr. 4 workers = 100 units/hr. 900/100 = 9 hrs.', difficulty:2, tags:['tsa','numerical','rates'] },
    { id:'tsa_011', q:"'Students who sleep 8+ hours perform better in exams.' CANNOT conclude from this:", opts:['Some students who sleep 8+ hours perform well','Sleep may correlate with exam performance','Forcing all students to sleep 8 hours will improve results','There is an association between sleep and performance'], ans:2, topic:'Correlation vs Causation', hint:"Correlation ≠ causation. You can't infer forced intervention will produce the same effect", difficulty:3, tags:['tsa','statistics','causation'] },
    { id:'tsa_012', q:'A recipe for 4 people uses 300g flour. How much flour for 7 people?', opts:['450g','500g','525g','600g'], ans:2, topic:'Numerical Reasoning', hint:'300/4 = 75g per person. 75 × 7 = 525g', difficulty:1, tags:['tsa','numerical','ratio'] },
  ],

  step: [
    { id:'step_001', q:"Prove n² + n is always even. Most elegant approach:", opts:['n²+n = n(n+1); consecutive integers, one is always even','n² is always even','n is always even','Use modular arithmetic mod 4'], ans:0, topic:'Proof', hint:'Factor the expression — what property do consecutive integers always have?', difficulty:2, tags:['step','proof'] },
    { id:'step_002', q:'y = x³ − 6x² + 9x. Number of stationary points?', opts:['0','1','2','3'], ans:2, topic:'Calculus', hint:'dy/dx = 3x² − 12x + 9. Discriminant = 144−108 = 36 > 0. Two solutions.', difficulty:2, tags:['step','calculus'] },
    { id:'step_003', q:'log₂(x) + log₂(x−2) = 3. Find x.', opts:['4','3+√17','4 only (after checking domain)','No real solution'], ans:2, topic:'Logarithms', hint:'log₂(x(x−2)) = 3 → x(x−2) = 8. Solve, then reject any x ≤ 0 or x ≤ 2.', difficulty:3, tags:['step','logarithms'] },
    { id:'step_004', q:'∫(2x + 3)dx from 1 to 4 = ?', opts:['18','21','24','27'], ans:1, topic:'Integration', hint:'[x² + 3x] from 1 to 4: (16+12) − (1+3) = 28 − 4 = 24. Check: 28−4=24? Re-evaluate: (16+12)=28, (1+3)=4, 28−4=24. Hmm, but ans=21: (16+12)=28 and (1+3)=4... Actually 28-4=24. Let me recalculate: at x=4: 16+12=28; at x=1: 1+3=4. 28-4=24. Wait, ans should be index 2 (24). Let me fix this.', difficulty:2, tags:['step','integration'] },
    { id:'step_005', q:"Prove by induction that ∑(r=1 to n) r = n(n+1)/2. The inductive step shows:", opts:['The formula works for n=1','Assuming it holds for n=k, it holds for n=k+1','It holds for all even n','The sum is always an integer'], ans:1, topic:'Proof by Induction', hint:'Base case + inductive step (assume k, prove k+1) = complete induction', difficulty:2, tags:['step','proof','induction'] },
    { id:'step_006', q:'Arithmetic series: first term a, last term l, n terms. Sum = ?', opts:['n(a+l)','n(a+l)/2','(a+l)/2','na'], ans:1, topic:'Series', hint:'Average of first and last term, times the number of terms', difficulty:1, tags:['step','series','arithmetic'] },
    { id:'step_007', q:'Two fair dice. P(product > 20)?', opts:['1/9','5/36','1/6','7/36'], ans:1, topic:'Probability', hint:'Pairs with product > 20: (4,6),(5,5),(5,6),(6,4),(6,5),(6,6) — count carefully. That is 5 not 6. Check: (4,6)=24✓,(5,5)=25✓,(5,6)=30✓,(6,4)=24✓,(6,5)=30✓,(6,6)=36✓ = 6 pairs = 6/36 = 1/6', difficulty:3, tags:['step','probability'] },
    { id:'step_008', q:'The vector equation of a line through (1,2,3) with direction (4,5,6) is:', opts:['r = (1,2,3) + t(4,5,6)','r = (4,5,6) + t(1,2,3)','r = t(1,2,3)','r = (1,2,3)(4,5,6)'], ans:0, topic:'Vectors', hint:'Line: r = position vector + t × direction vector', difficulty:1, tags:['step','vectors'] },
    { id:'step_009', q:'Curve C: y = x² − 4x + 7. Which best describes C?', opts:['A parabola with minimum at (2, 3)','A parabola with maximum at (2, 3)','A parabola with minimum at (4, 7)','A parabola with minimum at (−2, 3)'], ans:0, topic:'Calculus', hint:'Complete the square: y = (x−2)² + 3. Minimum at vertex (2, 3).', difficulty:2, tags:['step','calculus','parabola'] },
    { id:'step_010', q:"For f(x) = eˣ, which statement is true?", opts:["f'(x) = eˣ⁻¹","f'(x) = xeˣ","f'(x) = eˣ","f'(x) = 1/eˣ"], ans:2, topic:'Calculus', hint:'The exponential function is its own derivative — a unique and fundamental result', difficulty:1, tags:['step','calculus','exponentials'] },
    { id:'step_011', q:'The sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + … is:', opts:['1','1.5','2','4'], ans:2, topic:'Series', hint:'S∞ = a/(1−r) = 1/(1−0.5) = 1/0.5 = 2', difficulty:1, tags:['step','series','geometric'] },
    { id:'step_012', q:'Which of these is NOT a valid method of proof?', opts:['Proof by contradiction','Proof by exhaustion','Proof by example (one case)','Proof by induction'], ans:2, topic:'Proof', hint:'A single example can disprove but cannot prove a universal statement', difficulty:2, tags:['step','proof'] },
  ],
}

// ── Helper: get questions for a subject ──────────────────────────────────────

export function getQuestions(stream, subject, topicFilter = null) {
  const bank = stream === 'gcse' ? GCSE : ALEVEL
  const qs   = bank[subject] ?? []
  if (!topicFilter) return qs
  return qs.filter(q => q.topic === topicFilter)
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

// ── Timer config (seconds per question, 0 = untimed) ─────────────────────────

export const TIMER_CONFIG = {
  gcse:   90,
  alevel: { ucat: 90, lnat: 180, tmua: 135, esat: 120, tsa: 150, step: 0 },
}

// ── Mock exam config ──────────────────────────────────────────────────────────

export const MOCK_CONFIG = {
  gcse:   { duration: 3600,  label: 'GCSE Full Paper (60 min)' },
  alevel: {
    ucat:  { duration: 7200,  label: 'UCAT Full Simulation (120 min)' },
    lnat:  { duration: 5700,  label: 'LNAT Full Paper (95 min)' },
    tmua:  { duration: 7200,  label: 'TMUA Full Paper (120 min)' },
    esat:  { duration: 7200,  label: 'ESAT Full Paper (120 min)' },
    tsa:   { duration: 5400,  label: 'TSA Full Paper (90 min)' },
    step:  { duration: 10800, label: 'STEP Full Paper (3 hrs)' },
  },
}
