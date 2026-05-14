/**
 * Generated Catalog: Class XII - Physics
 */
export const PHYSICS_CLASS_12 = {
  classId: 'class-12',
  classLabel: 'Class XII',
  subject: 'Physics',
  board: 'State Board',
  chapters: [
    {
      id: 'ch1',
      number: 1,
      title: 'Introduction to Physics',
      topics: [
        {
          id: 'ch1-t1',
          title: 'Basic Concepts',
          duration: '15 min',
          difficulty: 'foundation',
          animationType: 'physicsIntro',
          learningObjectives: [
            'Understand the basic concepts of Physics',
            'Apply fundamental principles to solve simple problems',
          ],
          mcq: [
            {
              id: 'ch1-t1-mcq1',
              text: 'What is the primary focus of this chapter?',
              options: ['Core principles', 'Advanced theories', 'Historical background', 'Practical applications'],
              correctIndex: 0,
              explanation: 'This introductory chapter focuses on core principles.'
            }
          ],
          numerical: [],
          questions: [
            {
              id: 'ch1-t1-q1',
              text: 'Explain the fundamental importance of Physics in everyday life.',
              hint: 'Think about practical examples where you observe these phenomena.',
              expectedConcepts: ['practical application', 'everyday observation'],
              estimatedTime: '3 min',
            }
          ],
          misconceptions: [
            {
              id: 'ch1-t1-m1',
              probe: 'Do you think Physics is only theoretical and has no real-world use?',
              options: ['Yes, it is mostly abstract', 'No, it applies directly to reality'],
              correctIndex: 1,
              correction: 'Physics provides the foundational rules governing real-world interactions.',
              detectKeywords: ['abstract', 'theoretical', 'not practical'],
            }
          ],
        }
      ]
    }
  ]
}
