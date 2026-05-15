export const ENGLISH_CLASS_12 = {
  classId: 'class-12',
  classLabel: 'Class XII',
  subject: 'English Core',
  board: 'CBSE / NCERT',
  chapters: [
    // ── Flamingo: Chapter 1: The Last Lesson ─────────────────────────────────────
    {
      id: 'ch1',
      number: 1,
      title: 'The Last Lesson (Flamingo)',
      topics: [
        {
          id: 'ch1-t1',
          title: 'Thematic Analysis and Character Sketch',
          duration: '15 min',
          difficulty: 'core',
          learningObjectives: [
            'Understand the themes of linguistic chauvinism and the pain of losing one\'s language',
            'Analyze the character transformations of Franz and M. Hamel'
          ],
          mcq: [
            { id: 'ch1-t1-mcq1', text: 'Why did M. Hamel wear his special Sunday clothes on the day of the last lesson?', options: ['It was a school festival', 'To show respect for the French language on the last day of teaching it', 'He had a parent-teacher meeting', 'He was being inspected by school authorities'], correctIndex: 1, explanation: 'M. Hamel dressed formally to honour the French language and mark the solemnity of the last French lesson.' }
          ],
          questions: [
            { id: 'ch1-t1-q1', text: 'Franz initially dreads going to school but changes by the end of the lesson. Trace this transformation and explain what brought it about.', hint: 'Notice how his attitude to the French language and to M. Hamel shifts.', expectedConcepts: ['starts fearing the lesson', 'M. Hamel\'s emotional speech', 'realization of losing language', 'regret and respect'], estimatedTime: '5 min' },
            { id: 'ch1-t1-q2', text: 'What does Daudet suggest by having the Prussians ban French lessons? What does language represent in the story?', hint: 'Language as identity and cultural freedom.', expectedConcepts: ['language = national identity', 'Prussian occupation', 'loss of freedom', 'language as resistance', 'key to their prison'], estimatedTime: '4 min' }
          ],
          misconceptions: [
            { id: 'ch1-t1-m1', probe: 'The story is set during World War I. True?', options: ['True', 'False — it is set during the Franco-Prussian War of 1870-71'], correctIndex: 1, correction: 'The Last Lesson takes place after France\'s defeat by Prussia in 1870-71, when Alsace-Lorraine became German territory and French lessons were banned.', detectKeywords: ['World War', '1914', 'First World War'] }
          ]
        }
      ]
    },
    // ── Flamingo: Chapter 2: Lost Spring ─────────────────────────────────────
    {
      id: 'ch2',
      number: 2,
      title: 'Lost Spring (Flamingo)',
      topics: [
        {
          id: 'ch2-t1',
          title: 'Poverty and Tradition',
          duration: '15 min',
          difficulty: 'core',
          learningObjectives: [
            'Analyze the impact of poverty and tradition on child labor',
            'Compare and contrast the lives of Saheb and Mukesh'
          ],
          mcq: [
            { id: 'ch2-t1-mcq1', text: 'What does the title "Lost Spring" symbolize?', options: ['Lost childhood', 'Autumn season', 'Lost money', 'Lost blooming flowers'], correctIndex: 0, explanation: 'Spring is the season of bloom and represents childhood. "Lost Spring" symbolizes the lost childhood of poor children like Saheb and Mukesh who are forced into labor.' }
          ],
          questions: [
            { id: 'ch2-t1-q1', text: 'How does the bangle-making industry of Firozabad trap generations of families? Discuss the roles of the middlemen and the police.', hint: 'Think about the "web of poverty" and the "vicious circle".', expectedConcepts: ['sahukars', 'middlemen', 'policemen', 'politicians', 'fear of being hauled up', 'no organizing into cooperatives'], estimatedTime: '5 min' }
          ],
          misconceptions: [
            { id: 'ch2-t1-m1', probe: 'Does Mukesh accept his fate to be a bangle maker like the rest of his family?', options: ['Yes, he believes it is his karma', 'No, he wants to break tradition and become a motor mechanic'], correctIndex: 1, correction: 'Unlike his family who believes bangle making is their god-given lineage (karma), Mukesh dares to dream of becoming a motor mechanic and breaking out of the vicious circle.', detectKeywords: ['yes he accepts', 'it is his karma'] }
          ]
        }
      ]
    },
    // Scaffolding remaining chapters
    { id: 'ch3', number: 3, title: 'Deep Water (Flamingo)', topics: [] },
    { id: 'ch4', number: 4, title: 'The Rattrap (Flamingo)', topics: [] },
    { id: 'ch5', number: 5, title: 'Indigo (Flamingo)', topics: [] },
    { id: 'ch6', number: 6, title: 'Poets and Pancakes (Flamingo)', topics: [] },
    { id: 'ch7', number: 7, title: 'The Interview (Flamingo)', topics: [] },
    { id: 'ch8', number: 8, title: 'Going Places (Flamingo)', topics: [] },
    { id: 'ch9', number: 9, title: 'My Mother at Sixty-six (Flamingo Poetry)', topics: [] },
    { id: 'ch10', number: 10, title: 'Keeping Quiet (Flamingo Poetry)', topics: [] },
    { id: 'ch11', number: 11, title: 'A Thing of Beauty (Flamingo Poetry)', topics: [] },
    { id: 'ch12', number: 12, title: 'A Roadside Stand (Flamingo Poetry)', topics: [] },
    { id: 'ch13', number: 13, title: 'Aunt Jennifer\'s Tigers (Flamingo Poetry)', topics: [] },
    { id: 'v1', number: 14, title: 'The Third Level (Vistas)', topics: [] },
    { id: 'v2', number: 15, title: 'The Tiger King (Vistas)', topics: [] },
    { id: 'v3', number: 16, title: 'Journey to the end of the Earth (Vistas)', topics: [] },
    { id: 'v4', number: 17, title: 'The Enemy (Vistas)', topics: [] },
    { id: 'v5', number: 18, title: 'On the Face of It (Vistas)', topics: [] },
    { id: 'v6', number: 19, title: 'Memories of Childhood (Vistas)', topics: [] }
  ]
}
