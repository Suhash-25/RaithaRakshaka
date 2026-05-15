import { getAllLoadedCatalogs } from './catalogRegistry'

// The old static, template-generated list is gone.
// We keep this export empty so offlineContent.js doesn't crash if it tries to seed it.
export const OFFLINE_QUESTION_BANK = []

export function getOfflineQuestionByTopicId(topicId) {
  for (const catalog of getAllLoadedCatalogs()) {
    for (const chapter of (catalog.chapters || [])) {
      const topic = chapter.topics?.find(t => t.id === topicId)
      if (topic) {
        // Return the first question as default if requested by topic
        if (topic.questions && topic.questions.length > 0) {
           return {
             ...topic.questions[0],
             subjectId: catalog.subject.toLowerCase(),
             topicLabel: topic.title,
             conceptSummary: topic.title
           }
        }
        return {
           id: `${topicId}-q1`,
           subjectId: catalog.subject.toLowerCase(),
           topicId: topic.id,
           topicLabel: topic.title,
           expectedConcepts: [],
           conceptSummary: topic.title,
           offTrackKeywords: [],
           formulaSignals: []
        }
      }
    }
  }
  return null
}

export function getOfflineQuestionById(questionId) {
  for (const catalog of getAllLoadedCatalogs()) {
    for (const chapter of (catalog.chapters || [])) {
      for (const topic of (chapter.topics || [])) {
         if (topic.questions) {
            const q = topic.questions.find(q => q.id === questionId)
            if (q) {
              return {
                ...q,
                subjectId: catalog.subject.toLowerCase(),
                topicLabel: topic.title,
                conceptSummary: topic.title
              }
            }
         }
      }
    }
  }
  return null
}
