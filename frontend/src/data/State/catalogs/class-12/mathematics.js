export const MATHEMATICS_CLASS_12 = {
  classId: 'class-12',
  classLabel: 'Class XII',
  subject: 'Mathematics',
  board: 'CBSE / NCERT',
  chapters: [
    // ── Chapter 1: Relations and Functions ─────────────────────────────────────
    {
      id: 'ch1',
      number: 1,
      title: 'Relations and Functions',
      topics: [
        {
          id: 'ch1-t1',
          title: 'Types of Relations',
          duration: '15 min',
          difficulty: 'foundation',
          learningObjectives: [
            'Understand reflexive, symmetric, and transitive relations',
            'Define an equivalence relation'
          ],
          mcq: [
            { id: 'ch1-t1-mcq1', text: 'Let R be a relation on the set of lines L in a plane defined by l1 R l2 if l1 is perpendicular to l2. Then R is:', options: ['Reflexive', 'Symmetric', 'Transitive', 'Equivalence'], correctIndex: 1, explanation: 'A line cannot be perpendicular to itself, so not reflexive. If l1 is perp to l2, then l2 is perp to l1, so symmetric. If l1 perp l2 and l2 perp l3, l1 is parallel to l3, so not transitive.' }
          ],
          questions: [
            { id: 'ch1-t1-q1', text: 'Explain what makes a relation an equivalence relation, and provide a real-life mathematical example.', hint: 'Think about equality or congruence.', expectedConcepts: ['reflexive', 'symmetric', 'transitive', 'congruence of triangles', 'equality of numbers'], estimatedTime: '3 min' }
          ],
          misconceptions: [
            { id: 'ch1-t1-m1', probe: 'If a relation is symmetric and transitive, is it automatically reflexive?', options: ['Yes, a R b and b R a implies a R a', 'No, not necessarily'], correctIndex: 1, correction: 'No. For a R a to follow from transitivity (a R b and b R a), there must actually exist some b such that a R b. If an element "a" is related to nothing at all, it fails reflexivity.', detectKeywords: ['automatically reflexive', 'yes always'] }
          ]
        },
        {
          id: 'ch1-t2',
          title: 'Types of Functions',
          duration: '18 min',
          difficulty: 'core',
          learningObjectives: [
            'Identify one-one (injective) and onto (surjective) functions',
            'Determine bijective functions'
          ],
          numerical: [
            { id: 'ch1-t2-num1', text: 'Consider f: R → R given by f(x) = 3x - 4. If f(a) = 5, find the value of a.', answer: 3, unit: '', solution: 'f(a) = 3a - 4 = 5. Therefore, 3a = 9, so a = 3.', hint: 'Set 3x - 4 equal to 5 and solve for x.' }
          ],
          questions: [
            { id: 'ch1-t2-q1', text: 'Prove that the function f: R → R given by f(x) = x³ is a bijection.', hint: 'Show it is one-one by setting f(x1) = f(x2) and onto by showing every y has a cube root.', expectedConcepts: ['x1^3 = x2^3 implies x1 = x2', 'one-one', 'surjective', 'y^(1/3) is real for all real y'], estimatedTime: '5 min' }
          ],
          misconceptions: [
            { id: 'ch1-t2-m1', probe: 'Is every strictly increasing function onto (surjective)?', options: ['Yes, it covers all values', 'No, it might have horizontal asymptotes'], correctIndex: 1, correction: 'A strictly increasing function might be bounded (like f(x) = arctan(x) or e^x), meaning it does not map to the entire set of Real numbers, so it is not onto R.', detectKeywords: ['yes it covers all'] }
          ]
        }
      ]
    },
    // ── Chapter 2: Inverse Trigonometric Functions ─────────────────────────────────────
    {
      id: 'ch2',
      number: 2,
      title: 'Inverse Trigonometric Functions',
      topics: [
        {
          id: 'ch2-t1',
          title: 'Principal Value Branches',
          duration: '15 min',
          difficulty: 'core',
          learningObjectives: [
            'Find principal values of inverse trig functions',
            'Understand domain and range of inverse trig functions'
          ],
          numerical: [
            { id: 'ch2-t1-num1', text: 'Find the principal value of arcsin(-1/2) in degrees (use negative sign if applicable).', answer: -30, unit: 'degrees', solution: 'sin(-30°) = -1/2, and -30° lies in the principal branch [-90°, 90°].', hint: 'Think about which quadrant the sine is negative in for the principal branch [-π/2, π/2].' }
          ],
          questions: [
            { id: 'ch2-t1-q1', text: 'Why is it necessary to restrict the domain of trigonometric functions to define their inverses?', hint: 'Trig functions are periodic.', expectedConcepts: ['not one-one', 'periodic', 'horizontal line test', 'must be bijective to have an inverse'], estimatedTime: '3 min' }
          ],
          misconceptions: [
            { id: 'ch2-t1-m1', probe: 'Is arcsin(sin(x)) always equal to x for any real number x?', options: ['Yes, they cancel each other out', 'No, only when x is in the principal branch'], correctIndex: 1, correction: 'arcsin(sin(x)) = x is only true if x lies in the principal value branch, i.e., [-π/2, π/2]. Outside this range, it maps back into the principal branch.', detectKeywords: ['yes they cancel'] }
          ]
        }
      ]
    },
    // Scaffolding remaining chapters
    { id: 'ch3', number: 3, title: 'Matrices', topics: [] },
    { id: 'ch4', number: 4, title: 'Determinants', topics: [] },
    { id: 'ch5', number: 5, title: 'Continuity and Differentiability', topics: [] },
    { id: 'ch6', number: 6, title: 'Application of Derivatives', topics: [] },
    { id: 'ch7', number: 7, title: 'Integrals', topics: [] },
    { id: 'ch8', number: 8, title: 'Application of Integrals', topics: [] },
    { id: 'ch9', number: 9, title: 'Differential Equations', topics: [] },
    { id: 'ch10', number: 10, title: 'Vector Algebra', topics: [] },
    { id: 'ch11', number: 11, title: 'Three Dimensional Geometry', topics: [] },
    { id: 'ch12', number: 12, title: 'Linear Programming', topics: [] },
    { id: 'ch13', number: 13, title: 'Probability', topics: [] }
  ]
}
