/**
 * ACT Math question bank.
 * Topics: Pre-Algebra · Elementary Algebra · Intermediate Algebra · Coordinate Geometry · Plane Geometry · Trigonometry
 */

export const ACT_MATH_BATCH = [
  // ── Pre-Algebra ───────────────────────────────────────────────────────────────
  { id:'act_math_001', q:'What is the least common multiple (LCM) of 12 and 18?', opts:['6','24','36','54'], ans:2, topic:'Number Theory', hint:'List multiples of 18: 18, 36... Is 36 divisible by 12? Yes.', difficulty:1, tags:['pre-algebra','lcm'] },
  { id:'act_math_002', q:'A jacket originally costs $120 and is on sale for 25% off. What is the sale price?', opts:['$80','$85','$90','$95'], ans:2, topic:'Percentages', hint:'Discount = 25% of $120 = $30. Sale price = $120 − $30.', difficulty:1, tags:['pre-algebra','percentages'] },
  { id:'act_math_003', q:'What is 3/8 + 5/12?', opts:['8/20','19/24','8/24','17/24'], ans:1, topic:'Fractions', hint:'Common denominator is 24: 9/24 + 10/24.', difficulty:1, tags:['pre-algebra','fractions'] },
  { id:'act_math_004', q:'If a recipe calls for 2⅓ cups of flour and you want to make 1.5× the recipe, how many cups do you need?', opts:['3','3⅓','3½','3¾'], ans:2, topic:'Mixed Numbers', hint:'2⅓ = 7/3. Multiply by 3/2: 7/3 × 3/2 = 7/2 = 3.5.', difficulty:2, tags:['pre-algebra','mixed-numbers','scaling'] },
  { id:'act_math_005', q:'What is the value of |−15| + |8|?', opts:['−7','7','23','−23'], ans:2, topic:'Absolute Value', hint:'Absolute value gives the distance from zero — always non-negative.', difficulty:1, tags:['pre-algebra','absolute-value'] },

  // ── Elementary Algebra ────────────────────────────────────────────────────────
  { id:'act_math_006', q:'Solve for x: 4x − 3 = 2x + 9', opts:['3','4','5','6'], ans:3, topic:'Linear Equations', hint:'Move x terms to one side: 2x = 12, so x = 6.', difficulty:1, tags:['elementary-algebra','linear-equations'] },
  { id:'act_math_007', q:'Simplify: 3(2x − 4) − 2(x + 1)', opts:['4x − 14','4x − 10','8x − 14','6x − 10'], ans:0, topic:'Simplifying Expressions', hint:'Distribute: 6x − 12 − 2x − 2. Collect like terms.', difficulty:1, tags:['elementary-algebra','simplifying'] },
  { id:'act_math_008', q:'Which value of x satisfies 2x² = 50?', opts:['x = 5','x = ±5','x = 25','x = ±25'], ans:1, topic:'Quadratics — Basic', hint:'Divide by 2: x² = 25. Take square roots: x = ±5.', difficulty:1, tags:['elementary-algebra','quadratics'] },
  { id:'act_math_009', q:'If 3x + 2y = 14 and y = 4, what is x?', opts:['1','2','3','4'], ans:1, topic:'Substitution', hint:'Substitute y = 4: 3x + 8 = 14. Solve for x.', difficulty:1, tags:['elementary-algebra','substitution'] },
  { id:'act_math_010', q:'What is the solution to the inequality −3x > 12?', opts:['x > −4','x < −4','x > 4','x < 4'], ans:1, topic:'Inequalities', hint:'Divide both sides by −3. Remember: dividing by a negative flips the inequality sign.', difficulty:2, tags:['elementary-algebra','inequalities','negative-division'] },

  // ── Intermediate Algebra ──────────────────────────────────────────────────────
  { id:'act_math_011', q:'What are the solutions to x² − 7x + 10 = 0?', opts:['x=2 and x=5','x=−2 and x=−5','x=1 and x=10','x=5 and x=10'], ans:0, topic:'Quadratics', hint:'Factor: find two numbers that multiply to 10 and add to −7: −2 and −5. So (x−2)(x−5)=0.', difficulty:1, tags:['intermediate-algebra','quadratics','factoring'] },
  { id:'act_math_012', q:'Use the quadratic formula to solve x² + 2x − 8 = 0.', opts:['x=2 and x=−4','x=−2 and x=4','x=4 and x=−4','x=2 and x=4'], ans:0, topic:'Quadratic Formula', hint:'a=1, b=2, c=−8. Discriminant = 4+32=36. x = (−2±6)/2.', difficulty:2, tags:['intermediate-algebra','quadratic-formula'] },
  { id:'act_math_013', q:'If f(x) = 2x² − 3x + 1, what is f(−1)?', opts:['6','4','−4','0'], ans:0, topic:'Function Evaluation', hint:'Substitute x = −1: 2(1) − 3(−1) + 1 = 2 + 3 + 1 = 6.', difficulty:1, tags:['intermediate-algebra','functions'] },
  { id:'act_math_014', q:'Simplify: (x² − 9) / (x − 3)', opts:['x + 3','x − 3','x² + 3','x/(x−3)'], ans:0, topic:'Rational Expressions', hint:'Factor the numerator: x² − 9 = (x+3)(x−3). Cancel the common factor.', difficulty:2, tags:['intermediate-algebra','rational-expressions','factoring'] },
  { id:'act_math_015', q:'The graph of y = −x² + 4 opens ___ and has a vertex at ___.', opts:['upward; (0, 4)','downward; (0, 4)','upward; (0, −4)','downward; (0, −4)'], ans:1, topic:'Parabolas', hint:'Negative leading coefficient → opens downward. Vertex form: h=0, k=4.', difficulty:2, tags:['intermediate-algebra','parabolas'] },

  // ── Coordinate Geometry ────────────────────────────────────────────────────────
  { id:'act_math_016', q:'What is the distance between points (1, 2) and (4, 6)?', opts:['3','4','5','7'], ans:2, topic:'Distance Formula', hint:'d = √((4−1)² + (6−2)²) = √(9+16) = √25.', difficulty:1, tags:['coordinate-geometry','distance-formula'] },
  { id:'act_math_017', q:'What is the midpoint of the segment from (−2, 4) to (6, −2)?', opts:['(2, 1)','(4, 2)','(2, 2)','(4, 1)'], ans:0, topic:'Midpoint Formula', hint:'Midpoint = ((−2+6)/2, (4+(−2))/2) = (4/2, 2/2).', difficulty:1, tags:['coordinate-geometry','midpoint-formula'] },
  { id:'act_math_018', q:'What is the slope of the line perpendicular to y = ½x + 3?', opts:['½','−½','2','−2'], ans:3, topic:'Slope & Perpendicular Lines', hint:'Perpendicular slopes are negative reciprocals. Reciprocal of ½ is 2; negate it: −2.', difficulty:2, tags:['coordinate-geometry','slope','perpendicular'] },
  { id:'act_math_019', q:'Which point lies on the circle x² + y² = 25?', opts:['(3, 3)','(4, 3)','(5, 1)','(2, 4)'], ans:1, topic:'Circles — Standard Form', hint:'Check: does x²+y²=25? Try (4,3): 16+9=25. Yes!', difficulty:1, tags:['coordinate-geometry','circles'] },
  { id:'act_math_020', q:'What is the x-intercept of the line 3x − 2y = 12?', opts:['(2, 0)','(4, 0)','(6, 0)','(0, 4)'], ans:1, topic:'Intercepts', hint:'Set y=0: 3x = 12, so x = 4.', difficulty:1, tags:['coordinate-geometry','intercepts'] },

  // ── Plane Geometry ────────────────────────────────────────────────────────────
  { id:'act_math_021', q:'Two angles of a triangle are 47° and 83°. What is the third angle?', opts:['40°','50°','60°','70°'], ans:1, topic:'Triangle Angles', hint:'Angles in a triangle sum to 180°. 180 − 47 − 83 = ?', difficulty:1, tags:['geometry','triangles','angles'] },
  { id:'act_math_022', q:'A rectangle has length 15 cm and width 8 cm. What is the length of its diagonal?', opts:['13 cm','15 cm','17 cm','19 cm'], ans:2, topic:'Pythagorean Theorem', hint:'Use a²+b²=c²: 15²+8²=225+64=289. √289=17.', difficulty:1, tags:['geometry','pythagorean','rectangles'] },
  { id:'act_math_023', q:'A circle has circumference 10π. What is its area?', opts:['5π','10π','25π','100π'], ans:2, topic:'Circles', hint:'C = 2πr = 10π → r = 5. Area = πr² = 25π.', difficulty:2, tags:['geometry','circles','area'] },
  { id:'act_math_024', q:'An isosceles triangle has two equal sides of 10 and a base of 12. What is its area?', opts:['48','56','64','80'], ans:0, topic:'Triangles — Area', hint:'Height: use Pythagoras on half the base. h²+6²=10² → h=8. Area = ½×12×8.', difficulty:2, tags:['geometry','triangles','area','isosceles'] },
  { id:'act_math_025', q:'Two parallel lines are cut by a transversal. The co-interior (same-side interior) angles are 3x + 10 and 2x + 30. Find x.', opts:['20°','28°','30°','34°'], ans:1, topic:'Parallel Lines & Transversals', hint:'Co-interior angles are supplementary: (3x+10)+(2x+30)=180. Solve for x.', difficulty:2, tags:['geometry','parallel-lines','transversal'] },
  { id:'act_math_026', q:'A rectangular prism has length 6, width 4, and height 5. What is its volume?', opts:['100','120','140','148'], ans:1, topic:'3D Geometry', hint:'Volume = length × width × height.', difficulty:1, tags:['geometry','3d','volume'] },
  { id:'act_math_027', q:'The exterior angle of a regular polygon is 40°. How many sides does it have?', opts:['7','8','9','10'], ans:2, topic:'Polygons', hint:'Sum of exterior angles = 360°. Number of sides = 360 ÷ 40.', difficulty:2, tags:['geometry','polygons','exterior-angles'] },

  // ── Trigonometry ──────────────────────────────────────────────────────────────
  { id:'act_math_028', q:'In a right triangle, the angle is 30° and the hypotenuse is 10. What is the length of the side opposite to 30°?', opts:['5','5√3','10','10√3'], ans:0, topic:'Trigonometry', hint:'sin 30° = opposite/hypotenuse = ½. Opposite = 10 × ½ = 5.', difficulty:1, tags:['trigonometry','sin-cos-tan','special-angles'] },
  { id:'act_math_029', q:'What is the value of tan 45°?', opts:['0','1/√2','1','√2'], ans:2, topic:'Trigonometry — Special Angles', hint:'In a 45-45-90 triangle, opposite = adjacent. tan = opposite/adjacent = 1.', difficulty:1, tags:['trigonometry','special-angles','tan'] },
  { id:'act_math_030', q:'Which is an equivalent expression for sin²θ + cos²θ?', opts:['0','2','1','tan²θ'], ans:2, topic:'Trigonometric Identities', hint:'This is the Pythagorean identity — it always equals 1.', difficulty:1, tags:['trigonometry','identities','pythagorean-identity'] },
]
