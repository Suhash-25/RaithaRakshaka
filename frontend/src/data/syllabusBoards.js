import cbseClass1 from './CBSE/class-1.json'
import cbseClass2 from './CBSE/class-2.json'
import cbseClass3 from './CBSE/class-3.json'
import cbseClass4 from './CBSE/class-4.json'
import cbseClass5 from './CBSE/class-5.json'
import cbseClass6 from './CBSE/class-6.json'
import cbseClass7 from './CBSE/class-7.json'
import cbseClass8 from './CBSE/class-8.json'
import cbseClass9 from './CBSE/class-9.json'
import cbseClass10 from './CBSE/class-10.json'
import cbseClass11 from './CBSE/class-11.json'
import cbseClass12 from './CBSE/class-12.json'
import stateClass1 from './State/class 1/knowledge_enhanced.json'
import stateClass2 from './State/class 2/knowledge_enhanced.json'
import stateClass3 from './State/class 3/knowledge_enhanced.json'
import stateClass4 from './State/class 4/knowledge_enhanced.json'
import stateClass5 from './State/class 5/knowledge_enhanced.json'
import stateClass6 from './State/class 6/knowledge_enhanced.json'
import stateClass7 from './State/class 7/knowledge_enhanced.json'
import stateClass8 from './State/class 8/knowledge_enhanced.json'
import stateClass9 from './State/class 9/knowledge_enhanced.json'
import stateClass10 from './State/class 10/knowledge_enhanced.json'
import stateClass11 from './State/class 11/knowledge_enhanced.json'
import stateClass12 from './State/class 12/knowledge_enhanced.json'

const CBSE_CLASSES = [
  cbseClass1,
  cbseClass2,
  cbseClass3,
  cbseClass4,
  cbseClass5,
  cbseClass6,
  cbseClass7,
  cbseClass8,
  cbseClass9,
  cbseClass10,
  cbseClass11,
  cbseClass12,
]

const STATE_CLASSES = [
  stateClass1,
  stateClass2,
  stateClass3,
  stateClass4,
  stateClass5,
  stateClass6,
  stateClass7,
  stateClass8,
  stateClass9,
  stateClass10,
  stateClass11,
  stateClass12,
]

export const BOARD_META = {
  state: {
    id: 'state',
    label: 'State Board',
    description: 'Karnataka State syllabus content with class-wise subjects, chapters, topic descriptions, and optional visual learning.',
  },
  cbse: {
    id: 'cbse',
    label: 'CBSE',
    description: 'CBSE syllabus content separated by class, subject, chapter, and topic for quick text-first study.',
  },
}

export function normalizeClassId(value) {
  const number = getClassNumber(value)
  return number ? `class-${String(number).padStart(2, '0')}` : String(value ?? '').toLowerCase()
}

export function displayClassLabel(value) {
  const number = getClassNumber(value)
  return number ? `Class ${number}` : String(value ?? 'Class')
}

export function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item'
}

export function buildTopicDescription({ boardLabel, classLabel, subjectName, chapterTitle, topicName }) {
  return [
    `${topicName} is part of ${chapterTitle} in ${subjectName} for ${classLabel}. This topic introduces the main idea in a text-first way so students can understand the concept before jumping into practice or visuals.`,
    `Focus on what the topic means, where it appears in the chapter, and how it connects to everyday examples. Once the explanation feels clear, the visual option can be opened for a video-based understanding.`,
    `This content is mapped from the ${boardLabel} syllabus and is meant to help students revise the chapter in small, manageable topic blocks.`,
  ].join('\n\n')
}

export function buildVisualVideoUrl(query) {
  const encoded = encodeURIComponent(query)
  return `https://www.youtube.com/embed?listType=search&list=${encoded}`
}

export function buildVisualSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export function getCbseOverview() {
  const classes = CBSE_CLASSES.map((classData) => {
    const classSlug = normalizeClassId(classData.class)
    const classLabel = displayClassLabel(classData.class)
    const subjects = (classData.subjects ?? []).map((subject) => {
      const subjectSlug = slugify(subject.subject_name)
      const chapterCount = subject.chapters?.length ?? 0
      const topicCount = (subject.chapters ?? []).reduce((sum, chapter) => sum + (chapter.topics?.length ?? 0), 0)

      return {
        subject_slug: subjectSlug,
        subject_label: subject.subject_name,
        textbook: subject.textbook,
        total_pages: topicCount,
        document_count: subject.textbook ? 1 : 0,
        chapter_count: chapterCount,
        topic_count: topicCount,
        documents: [
          {
            document_id: `${classSlug}-${subjectSlug}-cbse-syllabus`,
            document_title: subject.textbook || `${subject.subject_name} Syllabus`,
            document_kind: 'syllabus',
          },
        ],
      }
    })

    return {
      class_slug: classSlug,
      class_label: classLabel,
      board: classData.board ?? 'CBSE',
      academic_year: classData.academic_year,
      medium: classData.medium,
      subject_count: subjects.length,
      total_pages: subjects.reduce((sum, subject) => sum + subject.topic_count, 0),
      subjects,
    }
  })

  return {
    board: 'CBSE',
    board_id: 'cbse',
    academic_year: '2025-26',
    total_pages: classes.reduce((sum, classItem) => sum + classItem.total_pages, 0),
    classes,
  }
}

export function getCbseClass(classId) {
  return getCbseOverview().classes.find((classItem) => classItem.class_slug === normalizeClassId(classId)) ?? null
}

export function getStateOverview() {
  const classes = STATE_CLASSES.map((classData) => {
    const classSlug = normalizeClassId(classData.class)
    const classLabel = displayClassLabel(classData.class)
    const subjects = (classData.subjects ?? []).map((subject) => normalizeStateSubject(subject, classSlug))

    return {
      class_slug: classSlug,
      class_label: classLabel,
      board: classData.board ?? 'Karnataka State Board',
      academic_year: classData.academic_year,
      medium: classData.medium,
      mediums_available: classData.mediums_available ?? [],
      subject_count: subjects.length,
      total_pages: subjects.reduce((sum, subject) => sum + subject.topic_count, 0),
      subjects,
    }
  })

  return {
    board: 'State Board',
    board_id: 'state',
    academic_year: '2025-26',
    total_pages: classes.reduce((sum, classItem) => sum + classItem.total_pages, 0),
    classes,
  }
}

export function getStateClass(classId) {
  return getStateOverview().classes.find((classItem) => classItem.class_slug === normalizeClassId(classId)) ?? null
}

export function getCbseCatalog(classId, subjectId) {
  const sourceClass = CBSE_CLASSES.find((classData) => normalizeClassId(classData.class) === normalizeClassId(classId))
  if (!sourceClass) return null

  const classSlug = normalizeClassId(sourceClass.class)
  const classLabel = displayClassLabel(sourceClass.class)
  const subject = (sourceClass.subjects ?? []).find((entry) => slugify(entry.subject_name) === subjectId)
  if (!subject) return null

  return {
    classId: classSlug,
    classLabel,
    subject: subject.subject_name,
    subjectId,
    board: 'CBSE',
    textbook: subject.textbook,
    chapters: (subject.chapters ?? []).map((chapter, chapterIndex) => {
      const chapterNumber = chapter.chapter_number ?? chapterIndex + 1
      const chapterId = `ch${chapterNumber}`
      const chapterTitle = chapter.chapter_title

      return {
        id: chapterId,
        number: chapterNumber,
        title: chapterTitle,
        topics: (chapter.topics ?? []).map((topicName, topicIndex) => {
          const topicId = `${chapterId}-t${topicIndex + 1}-${slugify(topicName).slice(0, 32)}`
          const videoQuery = `${classLabel} ${subject.subject_name} ${chapterTitle} ${topicName} CBSE explanation`

          return {
            id: topicId,
            title: topicName,
            duration: '6 min read',
            difficulty: 'foundation',
            description: buildTopicDescription({
              boardLabel: 'CBSE',
              classLabel,
              subjectName: subject.subject_name,
              chapterTitle,
              topicName,
            }),
            visualVideoUrl: buildVisualVideoUrl(videoQuery),
            visualSearchUrl: buildVisualSearchUrl(videoQuery),
            learningObjectives: [
              `Understand ${topicName} in the context of ${chapterTitle}.`,
              `Connect the topic to examples from ${subject.subject_name}.`,
            ],
            keyPoints: [
              `${topicName} belongs to ${chapterTitle}.`,
              `Read the description first, then open the visual explanation only when needed.`,
              `Use the chapter context to revise related topics together.`,
            ],
            questions: [],
            misconceptions: [],
          }
        }),
      }
    }),
  }
}

export function getStateCatalog(classId, subjectId) {
  const sourceClass = STATE_CLASSES.find((classData) => normalizeClassId(classData.class) === normalizeClassId(classId))
  if (!sourceClass) return null

  const classSlug = normalizeClassId(sourceClass.class)
  const classLabel = displayClassLabel(sourceClass.class)
  const subject = (sourceClass.subjects ?? []).find((entry) => slugify(entry.subject_name) === subjectId)
  if (!subject) return null

  return {
    classId: classSlug,
    classLabel,
    subject: subject.subject_name,
    subjectId,
    board: 'State Board',
    textbook: (subject.official_books ?? []).join(', '),
    chapters: flattenStateChapters(subject).map((chapter, chapterIndex) => {
      const chapterNumber = chapter.chapter_no ?? chapterIndex + 1
      const chapterId = `ch${chapterNumber}`
      const chapterTitle = chapter.chapter_name

      return {
        id: chapterId,
        number: chapterNumber,
        title: chapterTitle,
        topics: (chapter.concepts ?? []).map((concept, topicIndex) => {
          const topicId = `${chapterId}-t${topicIndex + 1}-${slugify(concept.topic_name).slice(0, 32)}`
          const videoQuery = `${classLabel} ${subject.subject_name} ${chapterTitle} ${concept.topic_name} State syllabus explanation`

          return {
            id: topicId,
            title: concept.topic_name,
            duration: concept.estimated_read_time || '5 min read',
            difficulty: concept.difficulty || 'foundation',
            description: concept.description || buildTopicDescription({
              boardLabel: 'State Board',
              classLabel,
              subjectName: subject.subject_name,
              chapterTitle,
              topicName: concept.topic_name,
            }),
            keyPoints: concept.key_points ?? [],
            formulas: concept.formulas ?? [],
            siUnits: concept.si_units ?? [],
            methods: concept.methods ?? [],
            shortcutTricks: concept.shortcut_tricks ?? [],
            rememberThis: concept.remember_this ?? [],
            visualVideoUrl: buildVisualVideoUrl(videoQuery),
            visualSearchUrl: buildVisualSearchUrl(videoQuery),
            learningObjectives: [
              `Understand ${concept.topic_name} in ${chapterTitle}.`,
              `Use the key points and methods for quick revision.`,
            ],
            questions: [],
            misconceptions: [],
          }
        }),
      }
    }),
  }
}

export function enrichStateCatalog(catalog) {
  if (!catalog) return catalog
  const detailed = getStateCatalog(catalog.classId, slugify(catalog.subject))
  if (!detailed) return catalog

  return {
    ...catalog,
    textbook: catalog.textbook ?? detailed.textbook,
    chapters: (catalog.chapters ?? detailed.chapters).map((chapter) => {
      const detailChapter = findMatchingChapter(detailed.chapters, chapter)
      if (!detailChapter) return chapter

      return {
        ...chapter,
        topics: (chapter.topics ?? detailChapter.topics).map((topic) => {
          const detailTopic = findMatchingTopic(detailChapter.topics, topic)
          return detailTopic ? { ...detailTopic, ...topic, description: detailTopic.description } : topic
        }),
      }
    }),
  }
}

function normalizeStateSubject(subject, classSlug) {
  const subjectSlug = slugify(subject.subject_name)
  const chapters = flattenStateChapters(subject)
  const topicCount = chapters.reduce((sum, chapter) => sum + (chapter.concepts?.length ?? 0), 0)

  return {
    subject_slug: subjectSlug,
    subject_label: subject.subject_name,
    textbook: (subject.official_books ?? []).join(', '),
    total_pages: topicCount,
    document_count: subject.official_books?.length || 1,
    chapter_count: chapters.length,
    topic_count: topicCount,
    documents: [
      {
        document_id: `${classSlug}-${subjectSlug}-state-syllabus`,
        document_title: (subject.official_books ?? [subject.subject_name]).join(' + '),
        document_kind: 'syllabus',
      },
    ],
  }
}

function flattenStateChapters(subject) {
  return (subject.parts ?? []).flatMap((part) => part.chapters ?? [])
}

function findMatchingChapter(chapters, chapter) {
  return chapters.find((candidate) => (
    candidate.number === chapter.number ||
    slugify(candidate.title) === slugify(chapter.title)
  ))
}

function findMatchingTopic(topics, topic) {
  return topics.find((candidate) => (
    slugify(candidate.title) === slugify(topic.title) ||
    candidate.title.toLowerCase().includes(topic.title.toLowerCase()) ||
    topic.title.toLowerCase().includes(candidate.title.toLowerCase())
  ))
}

function getClassNumber(value) {
  const numericMatch = String(value ?? '').match(/(\d+)/)
  if (numericMatch) return Number(numericMatch[1])

  const romanMatch = String(value ?? '').match(/\b(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\b/i)
  if (!romanMatch) return null
  const numerals = { i: 1, v: 5, x: 10 }
  let total = 0
  let previous = 0

  for (const character of romanMatch[1].toLowerCase().split('').reverse()) {
    const current = numerals[character] ?? 0
    if (current < previous) total -= current
    else {
      total += current
      previous = current
    }
  }

  return total
}
