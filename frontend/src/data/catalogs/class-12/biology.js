export const BIOLOGY_CLASS_12 = {
  classId: 'class-12',
  classLabel: 'Class XII',
  subject: 'Biology',
  board: 'CBSE / NCERT',
  chapters: [
    // ── Chapter 1: Reproduction in Organisms ─────────────────────────────────────
    {
      id: 'ch1',
      number: 1,
      title: 'Reproduction in Organisms',
      topics: [
        {
          id: 'ch1-t1',
          title: 'Asexual Reproduction',
          duration: '12 min',
          difficulty: 'foundation',
          learningObjectives: [
            'Define asexual reproduction and its types',
            'Identify vegetative propagules in plants'
          ],
          mcq: [
            { id: 'ch1-t1-mcq1', text: 'Which of the following is a vegetative propagule in Agave?', options: ['Rhizome', 'Bulbil', 'Offset', 'Sucker'], correctIndex: 1, explanation: 'In Agave, vegetative propagation occurs through bulbils.' }
          ],
          questions: [
            { id: 'ch1-t1-q1', text: 'Why is the offspring formed by asexual reproduction referred to as a clone?', hint: 'Consider their genetic and morphological makeup.', expectedConcepts: ['morphologically identical', 'genetically identical', 'single parent'], estimatedTime: '2 min' }
          ],
          misconceptions: [
            { id: 'ch1-t1-m1', probe: 'Does asexual reproduction only occur in single-celled organisms?', options: ['Yes, multicellular organisms only reproduce sexually', 'No, it occurs in many plants and some simple animals too'], correctIndex: 1, correction: 'Asexual reproduction is common in single-celled organisms, but it also occurs in plants (vegetative propagation) and simple animals like Hydra (budding) and sponges.', detectKeywords: ['yes only single-celled'] }
          ]
        }
      ]
    },
    // ── Chapter 2: Sexual Reproduction in Flowering Plants ─────────────────────────
    {
      id: 'ch2',
      number: 2,
      title: 'Sexual Reproduction in Flowering Plants',
      topics: [
        {
          id: 'ch2-t1',
          title: 'Pre-fertilization: Structures and Events',
          duration: '18 min',
          difficulty: 'core',
          learningObjectives: [
            'Understand microsporogenesis and megasporogenesis',
            'Describe the structure of pollen grain and embryo sac'
          ],
          mcq: [
            { id: 'ch2-t1-mcq1', text: 'The exine of pollen grains is made up of a highly resistant organic material called:', options: ['Cellulose', 'Pectin', 'Sporopollenin', 'Lignin'], correctIndex: 2, explanation: 'Sporopollenin is one of the most resistant organic materials known. It can withstand high temperatures and strong acids/alkalis.' }
          ],
          questions: [
            { id: 'ch2-t1-q1', text: 'Describe the typical 7-celled, 8-nucleate structure of a mature angiosperm embryo sac.', hint: 'Mention the egg apparatus, central cell, and antipodals.', expectedConcepts: ['three antipodals at chalazal end', 'two synergids and one egg cell at micropylar end', 'large central cell with two polar nuclei'], estimatedTime: '5 min' }
          ],
          misconceptions: [
            { id: 'ch2-t1-m1', probe: 'Is a pollen grain the male gamete?', options: ['Yes, pollen is the male gamete', 'No, it is the male gametophyte that carries the male gametes'], correctIndex: 1, correction: 'A pollen grain is not the male gamete itself; it is the male gametophyte, which produces and carries the male gametes (sperm cells) to the embryo sac.', detectKeywords: ['yes it is the male gamete'] }
          ]
        }
      ]
    },
    // Scaffolding remaining chapters
    { id: 'ch3', number: 3, title: 'Human Reproduction', topics: [] },
    { id: 'ch4', number: 4, title: 'Reproductive Health', topics: [] },
    { id: 'ch5', number: 5, title: 'Principles of Inheritance and Variation', topics: [] },
    { id: 'ch6', number: 6, title: 'Molecular Basis of Inheritance', topics: [] },
    { id: 'ch7', number: 7, title: 'Evolution', topics: [] },
    { id: 'ch8', number: 8, title: 'Human Health and Disease', topics: [] },
    { id: 'ch9', number: 9, title: 'Strategies for Enhancement in Food Production', topics: [] },
    { id: 'ch10', number: 10, title: 'Microbes in Human Welfare', topics: [] },
    { id: 'ch11', number: 11, title: 'Biotechnology: Principles and Processes', topics: [] },
    { id: 'ch12', number: 12, title: 'Biotechnology and its Applications', topics: [] },
    { id: 'ch13', number: 13, title: 'Organisms and Populations', topics: [] },
    { id: 'ch14', number: 14, title: 'Ecosystem', topics: [] },
    { id: 'ch15', number: 15, title: 'Biodiversity and Conservation', topics: [] },
    { id: 'ch16', number: 16, title: 'Environmental Issues', topics: [] }
  ]
}
