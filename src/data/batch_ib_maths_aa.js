/**
 * IB Mathematics Analysis & Approaches question bank (post-2019 syllabus).
 * SL Topics: Algebra, Functions, Trigonometry, Statistics, Calculus basics
 * HL Topics: Proof, Complex Numbers, Advanced Calculus, Vectors, Differential Equations
 * Format: { id, q, opts, ans, topic, hint, difficulty, tags, tier:'sl'|'hl' }
 * 15 SL questions (ids 001–015), 15 HL questions (ids 016–030)
 */

export const IB_MATHS_AA_BATCH = [
  // ── SL: Algebra ────────────────────────────────────────────────────────────────
  { id:'ib_maths_aa_001', q:'The third term of an arithmetic sequence is 11 and the seventh term is 27. What is the common difference?', opts:['2','3','4','5'], ans:2, topic:'Algebra: Sequences', hint:'Use Tₙ = T₁ + (n−1)d and set up two equations.', difficulty:1, tags:['algebra','arithmetic-sequence','sl'], tier:'sl' },
  { id:'ib_maths_aa_002', q:'The sum of the first 10 terms of a geometric series is 1023 and the first term is 1. What is the common ratio?', opts:['1','2','3','4'], ans:1, topic:'Algebra: Series', hint:'Sₙ = a(rⁿ−1)/(r−1). Substitute n=10, S=1023, a=1 and solve.', difficulty:2, tags:['algebra','geometric-series','sl'], tier:'sl' },
  { id:'ib_maths_aa_003', q:'Expand and simplify (2x − 3)³ using the binomial theorem. What is the coefficient of x²?', opts:['−36','36','−54','54'], ans:0, topic:'Algebra: Binomial Theorem', hint:'Use (a+b)³ = a³+3a²b+3ab²+b³ with a=2x and b=−3. Focus on the x² term.', difficulty:2, tags:['algebra','binomial-theorem','sl'], tier:'sl' },

  // ── SL: Functions ──────────────────────────────────────────────────────────────
  { id:'ib_maths_aa_004', q:'The function f(x) = 2x² − 8x + 3 has its vertex at x = a. What is a?', opts:['1','2','3','4'], ans:1, topic:'Functions: Quadratics', hint:'Vertex x-coordinate: x = −b/(2a) = 8/4.', difficulty:1, tags:['functions','quadratic','vertex','sl'], tier:'sl' },
  { id:'ib_maths_aa_005', q:'If f(x) = 3x + 1 and g(x) = x², what is (f∘g)(2)?', opts:['7','13','49','25'], ans:1, topic:'Functions: Composition', hint:'(f∘g)(2) = f(g(2)) = f(4) = 3(4)+1.', difficulty:1, tags:['functions','composition','sl'], tier:'sl' },
  { id:'ib_maths_aa_006', q:'The graph of y = log₂(x) passes through the point (k, 3). What is k?', opts:['6','8','9','16'], ans:1, topic:'Functions: Logarithms', hint:'log₂(k) = 3 means 2³ = k.', difficulty:1, tags:['functions','logarithms','sl'], tier:'sl' },

  // ── SL: Trigonometry ──────────────────────────────────────────────────────────
  { id:'ib_maths_aa_007', q:'In triangle ABC, a = 7 cm, b = 9 cm, and angle C = 60°. Using the cosine rule, find c² (exact value).', opts:['58','67','58 − 63','67 − 63'], ans:1, topic:'Trigonometry: Cosine Rule', hint:'c² = a² + b² − 2ab cos C = 49 + 81 − 2(7)(9)(0.5).', difficulty:2, tags:['trigonometry','cosine-rule','sl'], tier:'sl' },
  { id:'ib_maths_aa_008', q:'Which of the following is equivalent to sin²θ + cos²θ − 1?', opts:['2sin²θ','0','−cos(2θ)','1'], ans:1, topic:'Trigonometry: Identities', hint:'This is a direct application of the Pythagorean identity.', difficulty:1, tags:['trigonometry','identity','sl'], tier:'sl' },
  { id:'ib_maths_aa_009', q:'Solve 2 sin x = √3 for 0 ≤ x ≤ 2π. How many solutions are there?', opts:['1','2','3','4'], ans:1, topic:'Trigonometry: Equations', hint:'sin x = √3/2. In [0, 2π] sine equals this positive value in two quadrants.', difficulty:2, tags:['trigonometry','equations','sl'], tier:'sl' },

  // ── SL: Statistics ────────────────────────────────────────────────────────────
  { id:'ib_maths_aa_010', q:'X ~ B(10, 0.4). What is P(X = 3)?', opts:['0.2150','0.2150','0.2508','0.1612'], ans:0, topic:'Statistics: Binomial', hint:'P(X=3) = C(10,3)(0.4)³(0.6)⁷. Use your GDC.', difficulty:2, tags:['statistics','binomial-distribution','sl'], tier:'sl' },
  { id:'ib_maths_aa_011', q:'For a normal distribution X ~ N(50, 16), what is P(X < 50)?', opts:['0.25','0.50','0.75','1.00'], ans:1, topic:'Statistics: Normal Distribution', hint:'P(X < μ) = 0.5 for any normal distribution by symmetry.', difficulty:1, tags:['statistics','normal-distribution','sl'], tier:'sl' },
  { id:'ib_maths_aa_012', q:'Pearson\'s correlation coefficient r = −0.92 indicates:', opts:['Strong positive linear correlation','Weak negative linear correlation','Strong negative linear correlation','No linear correlation'], ans:2, topic:'Statistics: Correlation', hint:'r close to −1 means a strong negative (downward) linear relationship.', difficulty:1, tags:['statistics','correlation','sl'], tier:'sl' },

  // ── SL: Calculus Basics ────────────────────────────────────────────────────────
  { id:'ib_maths_aa_013', q:'Find f ′(x) if f(x) = 4x³ − 3x + 7.', opts:['12x² − 3','12x² − 3x','4x² − 3','12x³ − 3'], ans:0, topic:'Calculus: Differentiation', hint:'Differentiate term by term using the power rule: d/dx(xⁿ) = nxⁿ⁻¹.', difficulty:1, tags:['calculus','differentiation','sl'], tier:'sl' },
  { id:'ib_maths_aa_014', q:'Evaluate ∫₀² (2x + 1) dx.', opts:['4','5','6','7'], ans:2, topic:'Calculus: Integration', hint:'Integrate to get [x²+x]₀². Substitute 2 and subtract value at 0.', difficulty:1, tags:['calculus','integration','definite-integral','sl'], tier:'sl' },
  { id:'ib_maths_aa_015', q:'The gradient of a curve at x = 2 is zero. This point is MOST likely:', opts:['An inflection point only','A y-intercept','A stationary point','A point of discontinuity'], ans:2, topic:'Calculus: Stationary Points', hint:'f ′(x) = 0 defines a stationary (turning) point.', difficulty:1, tags:['calculus','stationary-points','sl'], tier:'sl' },

  // ── HL: Proof ─────────────────────────────────────────────────────────────────
  { id:'ib_maths_aa_016', q:'Proof by mathematical induction requires which two steps?', opts:['Base case and inductive step','Assumption and contradiction','Direct step and converse','Conjecture and verification'], ans:0, topic:'Proof: Induction', hint:'Show it is true for n=1 (base), then assume true for n=k and prove for n=k+1.', difficulty:1, tags:['proof','induction','hl'], tier:'hl' },
  { id:'ib_maths_aa_017', q:'To prove "if n² is even then n is even" by contradiction, you assume:', opts:['n is even','n² is odd','n is odd and n² is even','n is odd and n² is odd'], ans:2, topic:'Proof: Contradiction', hint:'Proof by contradiction: negate the conclusion and derive a contradiction.', difficulty:2, tags:['proof','contradiction','hl'], tier:'hl' },

  // ── HL: Complex Numbers ────────────────────────────────────────────────────────
  { id:'ib_maths_aa_018', q:'What is the modulus of z = 3 + 4i?', opts:['3','4','5','7'], ans:2, topic:'Complex Numbers', hint:'|z| = √(3² + 4²) = √25.', difficulty:1, tags:['complex-numbers','modulus','hl'], tier:'hl' },
  { id:'ib_maths_aa_019', q:'Using De Moivre\'s theorem, (cos θ + i sin θ)³ equals:', opts:['cos(3θ) + i sin(3θ)','3cos θ + 3i sin θ','cos(θ³) + i sin(θ³)','3(cos θ + i sin θ)'], ans:0, topic:'Complex Numbers: De Moivre', hint:'De Moivre: (cis θ)ⁿ = cis(nθ).', difficulty:2, tags:['complex-numbers','de-moivre','hl'], tier:'hl' },
  { id:'ib_maths_aa_020', q:'If z = 1 + i, what is z² in Cartesian form?', opts:['1 + 2i','2i','2 + 2i','−2 + 2i'], ans:1, topic:'Complex Numbers', hint:'(1+i)² = 1 + 2i + i² = 1 + 2i − 1.', difficulty:2, tags:['complex-numbers','powers','hl'], tier:'hl' },

  // ── HL: Advanced Calculus ──────────────────────────────────────────────────────
  { id:'ib_maths_aa_021', q:'Differentiate y = e^(3x) sin x using the product rule. What is dy/dx?', opts:['3e^(3x) sin x + e^(3x) cos x','3e^(3x) cos x','e^(3x)(3 sin x − cos x)','e^(3x)(3 sin x + cos x)'], ans:3, topic:'Calculus: Product Rule', hint:'Product rule: (uv)′ = u′v + uv′. u = e^(3x), u′ = 3e^(3x); v = sin x, v′ = cos x.', difficulty:2, tags:['calculus','product-rule','hl'], tier:'hl' },
  { id:'ib_maths_aa_022', q:'Evaluate ∫ x eˣ dx using integration by parts.', opts:['xeˣ − eˣ + C','xeˣ + eˣ + C','eˣ − xeˣ + C','x²eˣ/2 + C'], ans:0, topic:'Calculus: Integration by Parts', hint:'Let u = x, dv = eˣ dx. Then du = dx, v = eˣ. Apply ∫u dv = uv − ∫v du.', difficulty:3, tags:['calculus','integration-by-parts','hl'], tier:'hl' },
  { id:'ib_maths_aa_023', q:'Which test can determine whether a stationary point is a point of inflection?', opts:['First derivative test','Second derivative test (= 0 is inconclusive)','Checking f(x) values only','Ratio test'], ans:1, topic:'Calculus: Points of Inflection', hint:'If f ′′(x) = 0 at a stationary point, further analysis (e.g., sign of f ′′ around the point) is needed.', difficulty:3, tags:['calculus','inflection','second-derivative','hl'], tier:'hl' },

  // ── HL: Vectors ────────────────────────────────────────────────────────────────
  { id:'ib_maths_aa_024', q:'If a = (2, −1, 3) and b = (1, 4, −2), what is a · b (dot product)?', opts:['−8','8','0','−10'], ans:0, topic:'Vectors', hint:'Dot product: (2)(1) + (−1)(4) + (3)(−2) = 2 − 4 − 6.', difficulty:1, tags:['vectors','dot-product','hl'], tier:'hl' },
  { id:'ib_maths_aa_025', q:'Two lines in 3D space are described as skew. This means they:', opts:['Intersect at exactly one point','Are parallel and never meet','Are neither parallel nor do they intersect','Lie in the same plane'], ans:2, topic:'Vectors: Lines in 3D', hint:'Skew lines are non-coplanar — they don\'t intersect and aren\'t parallel.', difficulty:2, tags:['vectors','skew-lines','3d-geometry','hl'], tier:'hl' },

  // ── HL: Differential Equations ─────────────────────────────────────────────────
  { id:'ib_maths_aa_026', q:'The general solution of dy/dx = 2y is:', opts:['y = 2x + C','y = Ce^(2x)','y = e^(2x) + C','y = 2e^x + C'], ans:1, topic:'Differential Equations', hint:'Separate variables: dy/y = 2 dx. Integrate both sides.', difficulty:2, tags:['differential-equations','separable','hl'], tier:'hl' },
  { id:'ib_maths_aa_027', q:'For the logistic equation dP/dt = kP(1 − P/L), what does L represent?', opts:['The initial population','The growth rate','The carrying capacity','The time constant'], ans:2, topic:'Differential Equations: Logistic', hint:'The term (1 − P/L) causes growth to slow as P approaches L.', difficulty:2, tags:['differential-equations','logistic','hl'], tier:'hl' },
  { id:'ib_maths_aa_028', q:'Solve the separable ODE: dy/dx = xy, given y(0) = 1. What is y?', opts:['y = e^(x)','y = e^(x²/2)','y = x²/2 + 1','y = Ce^x'], ans:1, topic:'Differential Equations', hint:'Separate: dy/y = x dx. Integrate: ln|y| = x²/2 + C. Apply initial condition y(0)=1 → C=0.', difficulty:3, tags:['differential-equations','separable','initial-conditions','hl'], tier:'hl' },
  { id:'ib_maths_aa_029', q:'Which of the following is a second-order linear ODE?', opts:['dy/dx = ky','d²y/dx² + 3 dy/dx + 2y = 0','(dy/dx)² = y','d³y/dx³ = 0'], ans:1, topic:'Differential Equations', hint:'Second-order means the highest derivative is the second.', difficulty:2, tags:['differential-equations','second-order','hl'], tier:'hl' },
  { id:'ib_maths_aa_030', q:'The integrating factor for dy/dx + 2y = eˣ is:', opts:['e^x','e^(2x)','2e^x','e^(−x)'], ans:1, topic:'Differential Equations: Linear', hint:'For dy/dx + P(x)y = Q(x), the integrating factor is e^(∫P dx) = e^(∫2 dx).', difficulty:3, tags:['differential-equations','integrating-factor','hl'], tier:'hl' },
]
