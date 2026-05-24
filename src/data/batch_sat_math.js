/**
 * SAT Math question bank.
 * Topics: Algebra · Advanced Math · Problem Solving & Data Analysis · Geometry & Trig
 * Format matches existing batches: { id, q, opts, ans, topic, hint, difficulty, tags }
 */

export const SAT_MATH_BATCH = [
  // ── Algebra ───────────────────────────────────────────────────────────────────
  { id:'sat_math_001', q:'If 3x − 7 = 14, what is the value of x?', opts:['5','6','7','8'], ans:2, topic:'Linear Equations', hint:'Add 7 to both sides, then divide by 3.', difficulty:1, tags:['algebra','linear'] },
  { id:'sat_math_002', q:'A line has equation y = −2x + 5. What is the y-intercept?', opts:['−2','2','5','−5'], ans:2, topic:'Linear Equations', hint:'In y = mx + b, b is the y-intercept.', difficulty:1, tags:['algebra','linear','graph'] },
  { id:'sat_math_003', q:'Solve the system: 2x + y = 10 and x − y = 2.', opts:['x=4, y=2','x=3, y=4','x=6, y=−2','x=2, y=6'], ans:0, topic:'Systems of Equations', hint:'Add both equations to eliminate y.', difficulty:2, tags:['algebra','systems'] },
  { id:'sat_math_004', q:'Which value of x satisfies |2x − 6| = 4?', opts:['x=1 only','x=5 only','x=1 and x=5','x=−1 and x=5'], ans:2, topic:'Absolute Value', hint:'Set 2x−6=4 and 2x−6=−4 and solve each.', difficulty:2, tags:['algebra','absolute-value'] },
  { id:'sat_math_005', q:'If f(x) = 3x + 2 and g(x) = x − 1, what is f(g(3))?', opts:['7','8','11','14'], ans:2, topic:'Functions', hint:'Find g(3) first, then substitute into f.', difficulty:2, tags:['algebra','functions','composition'] },
  { id:'sat_math_006', q:'The equation 4x + ky = 8 has infinitely many solutions when paired with 2x + 3y = 4. What is k?', opts:['3','6','4','1.5'], ans:1, topic:'Systems of Equations', hint:'For infinitely many solutions the equations must be multiples of each other. What multiple turns 2x→4x?', difficulty:2, tags:['algebra','systems'] },
  { id:'sat_math_007', q:'What is the solution set of 2x − 5 > 3?', opts:['x > 1','x > 4','x < 4','x ≥ 4'], ans:1, topic:'Inequalities', hint:'Add 5, then divide by 2. Inequality direction stays the same.', difficulty:1, tags:['algebra','inequalities'] },
  { id:'sat_math_008', q:'A car travels at a constant speed. After 3 hours it has gone 195 miles. How many miles will it travel in 5 hours?', opts:['275','300','325','350'], ans:2, topic:'Linear Equations', hint:'Find the rate first: miles = rate × time.', difficulty:1, tags:['algebra','rate','proportional'] },
  { id:'sat_math_009', q:'If 5(x − 2) = 3(x + 4), what is x?', opts:['7','9','11','13'], ans:2, topic:'Linear Equations', hint:'Expand both sides, then collect x terms.', difficulty:1, tags:['algebra','linear'] },
  { id:'sat_math_010', q:'The line through (2, 1) and (6, 9) has what slope?', opts:['1','1.5','2','2.5'], ans:2, topic:'Linear Equations', hint:'Slope = (y₂−y₁)/(x₂−x₁).', difficulty:1, tags:['algebra','slope'] },

  // ── Advanced Math ─────────────────────────────────────────────────────────────
  { id:'sat_math_011', q:'What are the solutions to x² − 5x + 6 = 0?', opts:['x=2 and x=3','x=−2 and x=−3','x=1 and x=6','x=−1 and x=6'], ans:0, topic:'Quadratics', hint:'Factor: find two numbers that multiply to 6 and add to −5.', difficulty:1, tags:['advanced-math','quadratics'] },
  { id:'sat_math_012', q:'Which expression is equivalent to (x + 3)²?', opts:['x²+6x+9','x²+9','x²+3x+9','x²+6x+6'], ans:0, topic:'Quadratics', hint:'Use (a+b)² = a²+2ab+b².', difficulty:1, tags:['advanced-math','quadratics','expanding'] },
  { id:'sat_math_013', q:'What is the vertex of y = x² − 4x + 7?', opts:['(2,3)','(−2,15)','(2,7)','(4,7)'], ans:0, topic:'Quadratics', hint:'x-coordinate of vertex: x = −b/(2a). Then find y.', difficulty:2, tags:['advanced-math','quadratics','vertex'] },
  { id:'sat_math_014', q:'If 2^(x+1) = 32, what is x?', opts:['3','4','5','6'], ans:1, topic:'Exponentials', hint:'Express 32 as a power of 2: 32 = 2⁵. Then 2^(x+1)=2⁵ → x+1=5.', difficulty:2, tags:['advanced-math','exponentials'] },
  { id:'sat_math_015', q:'Which is a factor of x² + x − 12?', opts:['(x+4)','(x+3)','(x−4)','(x−6)'], ans:0, topic:'Quadratics', hint:'Find two numbers that multiply to −12 and add to +1: +4 and −3.', difficulty:1, tags:['advanced-math','quadratics','factoring'] },
  { id:'sat_math_016', q:'The population of bacteria doubles every 3 hours. Starting from 200, what is the population after 9 hours?', opts:['800','1,200','1,600','1,800'], ans:2, topic:'Exponentials', hint:'Number of doublings = 9/3 = 3. Population = 200 × 2³.', difficulty:2, tags:['advanced-math','exponentials','modeling'] },
  { id:'sat_math_017', q:'What is the sum of all solutions to x² = 36?', opts:['0','6','12','36'], ans:0, topic:'Quadratics', hint:'Solutions are x=6 and x=−6. Their sum is 6+(−6)=0.', difficulty:1, tags:['advanced-math','quadratics'] },
  { id:'sat_math_018', q:'If f(x) = x² + 2x − 8, for which values of x does f(x) = 0?', opts:['x=2 and x=−4','x=−2 and x=4','x=4 and x=−4','x=2 and x=4'], ans:0, topic:'Quadratics', hint:'Factor: (x+4)(x−2). Set each factor to zero.', difficulty:2, tags:['advanced-math','quadratics','roots'] },
  { id:'sat_math_019', q:'Which equation has no real solutions?', opts:['x²−4=0','x²+4=0','x²−4x+4=0','x²+4x−4=0'], ans:1, topic:'Quadratics', hint:'Discriminant b²−4ac < 0 means no real solutions. Check x²+4=0: b=0, so −4×4<0.', difficulty:2, tags:['advanced-math','discriminant'] },
  { id:'sat_math_020', q:'Simplify: (3x²)(4x³)', opts:['7x⁵','12x⁵','12x⁶','7x⁶'], ans:1, topic:'Polynomial Expressions', hint:'Multiply coefficients and add exponents: 3×4=12, x²×x³=x⁵.', difficulty:1, tags:['advanced-math','polynomials','indices'] },

  // ── Problem Solving & Data Analysis ──────────────────────────────────────────
  { id:'sat_math_021', q:'A store reduces a $80 item by 15%. What is the sale price?', opts:['$64','$66','$68','$72'], ans:2, topic:'Percentages', hint:'Discount = 0.15 × 80 = $12. Sale price = 80 − 12.', difficulty:1, tags:['data-analysis','percentages'] },
  { id:'sat_math_022', q:'In a survey of 200 students, 45% prefer online learning. How many students is that?', opts:['80','85','90','95'], ans:2, topic:'Proportions', hint:'0.45 × 200.', difficulty:1, tags:['data-analysis','proportions'] },
  { id:'sat_math_023', q:'The mean of five numbers is 14. If four of them are 10, 12, 16, 18, what is the fifth?', opts:['12','14','16','18'], ans:1, topic:'Statistics', hint:'Total = 14 × 5 = 70. Subtract the four known values.', difficulty:1, tags:['data-analysis','mean'] },
  { id:'sat_math_024', q:'A data set has values 3, 5, 7, 7, 9, 11. What is the median?', opts:['6','7','8','9'], ans:1, topic:'Statistics', hint:'With an even number of values, median = mean of the two middle values (7 and 7).', difficulty:1, tags:['data-analysis','median'] },
  { id:'sat_math_025', q:'Ratio of red to blue marbles is 3:5. If there are 24 red marbles, how many blue are there?', opts:['30','35','40','45'], ans:2, topic:'Ratios', hint:'3 parts = 24, so 1 part = 8. Blue = 5 × 8.', difficulty:1, tags:['data-analysis','ratio'] },
  { id:'sat_math_026', q:'A scatterplot shows a linear trend. The line of best fit passes through (0, 4) and (5, 14). Predicted y when x = 8?', opts:['18','20','22','24'], ans:2, topic:'Data Analysis', hint:'Slope = (14−4)/5 = 2. Equation: y = 2x + 4. Plug in x=8.', difficulty:2, tags:['data-analysis','scatterplot','linear'] },
  { id:'sat_math_027', q:'P(A) = 0.3 and P(B) = 0.5. If A and B are independent, P(A and B) = ?', opts:['0.15','0.20','0.35','0.80'], ans:0, topic:'Probability', hint:'For independent events: P(A and B) = P(A) × P(B).', difficulty:2, tags:['data-analysis','probability'] },

  // ── Geometry & Trigonometry ───────────────────────────────────────────────────
  { id:'sat_math_028', q:'A right triangle has legs 9 and 12. What is the length of the hypotenuse?', opts:['13','14','15','16'], ans:2, topic:'Geometry', hint:'Pythagorean theorem: a²+b²=c². 81+144=225.', difficulty:1, tags:['geometry','pythagorean'] },
  { id:'sat_math_029', q:'A circle has radius 7. What is its area? (Leave in terms of π)', opts:['14π','28π','49π','98π'], ans:2, topic:'Geometry', hint:'Area = πr². Substitute r = 7.', difficulty:1, tags:['geometry','circles'] },
  { id:'sat_math_030', q:'In a right triangle, sin θ = 0.6. What is cos θ?', opts:['0.4','0.6','0.8','1.0'], ans:2, topic:'Trigonometry', hint:'Use sin²θ + cos²θ = 1. cos θ = √(1 − 0.36).', difficulty:2, tags:['geometry','trigonometry','identities'] },
]
