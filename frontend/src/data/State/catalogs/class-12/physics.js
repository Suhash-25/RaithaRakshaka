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
      title: 'Electric Charges and Fields',
      topics: [
        {
          id: 'ch1-t1',
          title: 'Introduction to Electric Charges',
          duration: '30 min',
          difficulty: 'intermediate',
          animationType: 'physicsIntro',
          description: `
Electric charge is a fundamental property of matter that causes it to experience a force when placed in an electromagnetic field. There are two types of electric charges: positive and negative (commonly carried by protons and electrons respectively). Like charges repel each other and unlike charges attract each other.

### Key Properties of Electric Charge
1. **Quantization**: Charge is always an integral multiple of the basic quantum of charge ($e = 1.6 \times 10^{-19}$ C). This means $q = ne$, where $n$ is an integer.
2. **Conservation**: The total charge of an isolated system remains constant. It can neither be created nor destroyed, only transferred from one body to another.
3. **Additivity**: The total charge of a system is the algebraic sum of all individual charges located anywhere inside the system.

### Charging Methods
- **By Friction**: Rubbing two suitable materials together transfers electrons from one to the other. For example, rubbing a glass rod with silk makes the glass positive and the silk negative.
- **By Conduction**: Bringing an uncharged body in contact with a charged body transfers charge directly.
- **By Induction**: Bringing a charged body near an uncharged conducting body induces opposite charges on the nearer end and similar charges on the farther end, without any physical contact.

Understanding these foundational concepts is crucial as they form the basis for Coulomb's Law, electric fields, and ultimately, the entire study of electromagnetism. Take your time to read through these principles and visualize how subatomic particles interact in your everyday surroundings.
          `.trim(),
          learningObjectives: [
            'Understand the fundamental properties of electric charge: quantization, conservation, and additivity.',
            'Explain the different methods of charging a body: friction, conduction, and induction.',
            'Apply the quantization formula (q = ne) to calculate the number of electrons.',
          ],
          mcq: [
            {
              id: 'ch1-t1-mcq1',
              text: 'Which of the following is NOT a fundamental property of electric charge?',
              options: ['Quantization', 'Conservation', 'Additivity', 'Continuous distribution'],
              correctIndex: 3,
              explanation: 'Charge is quantized, meaning it exists in discrete packets (multiples of e), not as a continuous distribution.'
            },
            {
              id: 'ch1-t1-mcq2',
              text: 'If a body has a charge of -3.2 × 10^(-19) C, how many excess electrons does it have?',
              options: ['1', '2', '3', '4'],
              correctIndex: 1,
              explanation: 'Using q = ne, n = q/e = (3.2 × 10^-19) / (1.6 × 10^-19) = 2.'
            },
            {
              id: 'ch1-t1-mcq3',
              text: 'When a glass rod is rubbed with silk, the glass rod acquires a positive charge because:',
              options: ['It gains protons from the silk', 'It loses electrons to the silk', 'It gains electrons from the air', 'Protons are created on its surface'],
              correctIndex: 1,
              explanation: 'Protons do not move. The glass rod becomes positively charged because it loses negatively charged electrons to the silk.'
            },
            {
              id: 'ch1-t1-mcq4',
              text: 'In the method of charging by induction, the charged body and the uncharged body:',
              options: ['Must touch each other', 'Must not touch each other', 'Must be rubbed together', 'Must be connected by a wire'],
              correctIndex: 1,
              explanation: 'Charging by induction happens without any physical contact between the two bodies.'
            }
          ],
          numerical: [],
          questions: [
            {
              id: 'ch1-t1-q1',
              text: 'State the law of conservation of electric charge and provide an everyday example.',
              hint: 'Think about what happens to the total charge when you rub a balloon on your hair.',
              expectedConcepts: ['total charge constant', 'isolated system', 'neither created nor destroyed', 'transferred'],
              estimatedTime: '4 min',
            },
            {
              id: 'ch1-t1-q2',
              text: 'Explain the difference between charging by conduction and charging by induction.',
              hint: 'Consider whether physical contact is required for both methods.',
              expectedConcepts: ['physical contact', 'direct transfer', 'no physical contact', 'polarization'],
              estimatedTime: '5 min',
            },
            {
              id: 'ch1-t1-q3',
              text: 'Why can a charge of 2.0 × 10^(-19) C not exist in nature?',
              hint: 'Remember the quantization of charge and the value of the elementary charge e.',
              expectedConcepts: ['quantization', 'integral multiple', '1.6 x 10^-19'],
              estimatedTime: '3 min',
            }
          ],
          misconceptions: [
            {
              id: 'ch1-t1-m1',
              probe: 'Do you think protons move from one object to another when static electricity is generated?',
              options: ['Yes, positive charges move to create a positive object.', 'No, only electrons move between objects.'],
              correctIndex: 1,
              correction: 'Protons are tightly bound in the nucleus. Only electrons, which are in the outer shells of atoms, can be transferred between objects to create static charges.',
              detectKeywords: ['protons move', 'positive charge transfers'],
            },
            {
              id: 'ch1-t1-m2',
              probe: 'Can an object have a charge of 0.5e?',
              options: ['Yes, charges can be divided infinitely.', 'No, charge is quantized and must be a whole integer multiple of e.'],
              correctIndex: 1,
              correction: 'Charge is quantized, meaning it can only exist as integer multiples of the elementary charge e. You cannot have half an electron.',
              detectKeywords: ['half charge', 'fractional charge'],
            }
          ],
        }
      ]
    }
  ]
}
