import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getLearningSelection, saveLearningSelection } from '@/utils/indexedDB'

const LearningSelectionContext = createContext(null)

const initialSelection = {
  boardId: null,
  boardLabel: null,
  classSlug: null,
  classLabel: null,
  subjectId: null,
  subjectLabel: null,
  documentId: null,
  documentTitle: null,
  chapterId: null,
  chapterLabel: null,
  topicId: null,
  topicLabel: null,
  topicPath: null,
  topicLevel: null,
  topicPageNumber: null,
}

export function LearningSelectionProvider({ children }) {
  const [selection, setSelection] = useState(initialSelection)
  const [isSelectionLoaded, setIsSelectionLoaded] = useState(false)
  const selectionRef = useRef(initialSelection)

  useEffect(() => {
    let cancelled = false

    getLearningSelection()
      .then((storedSelection) => {
        if (!cancelled && storedSelection) {
          const nextSelection = { ...initialSelection, ...storedSelection }
          selectionRef.current = nextSelection
          setSelection(nextSelection)
        }
      })
      .catch(() => {
        if (!cancelled) {
          selectionRef.current = initialSelection
          setSelection(initialSelection)
        }
      })
      .finally(() => {
        if (!cancelled) setIsSelectionLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectClass = useCallback(async (classItem, board = null) => {
    const nextSelection = {
      ...initialSelection,
      boardId: board?.id ?? selectionRef.current.boardId,
      boardLabel: board?.label ?? selectionRef.current.boardLabel,
      classSlug: classItem.class_slug ?? classItem.classSlug ?? classItem.id ?? null,
      classLabel: classItem.class_label ?? classItem.classLabel ?? classItem.label ?? null,
    }
    selectionRef.current = nextSelection
    setSelection(nextSelection)
    await saveLearningSelection(nextSelection)
  }, [])

  const selectSubject = useCallback(async (subject) => {
    const nextSelection = {
      ...selectionRef.current,
      subjectId: subject.subject_slug ?? subject.subjectSlug ?? subject.id ?? subject.slug ?? null,
      subjectLabel: subject.subject_label ?? subject.subjectLabel ?? subject.label ?? subject.name ?? null,
      documentId: null,
      documentTitle: null,
      chapterId: null,
      chapterLabel: null,
      topicId: null,
      topicLabel: null,
      topicPath: null,
      topicLevel: null,
      topicPageNumber: null,
    }
    selectionRef.current = nextSelection
    setSelection(nextSelection)
    await saveLearningSelection(nextSelection)
  }, [])

  const selectTopic = useCallback(async (subject, topic, metadata = {}) => {
    const nextSelection = {
      ...selectionRef.current,
      classSlug: metadata.classSlug ?? topic.classSlug ?? topic.class_slug ?? selectionRef.current.classSlug,
      classLabel: metadata.classLabel ?? topic.classLabel ?? topic.class_label ?? selectionRef.current.classLabel,
      subjectId: subject.subject_slug ?? subject.subjectSlug ?? subject.id ?? subject.slug ?? selectionRef.current.subjectId,
      subjectLabel: subject.subject_label ?? subject.subjectLabel ?? subject.label ?? subject.name ?? selectionRef.current.subjectLabel,
      documentId: metadata.documentId ?? topic.documentId ?? topic.document_id ?? selectionRef.current.documentId,
      documentTitle: metadata.documentTitle ?? topic.documentTitle ?? topic.document_title ?? selectionRef.current.documentTitle,
      chapterId: metadata.chapterId ?? topic.chapterId ?? topic.chapter_id ?? selectionRef.current.chapterId,
      chapterLabel: metadata.chapterLabel ?? topic.chapterLabel ?? topic.chapter_label ?? selectionRef.current.chapterLabel,
      topicId: topic.id ?? topic.slug ?? topic.topicId ?? null,
      topicLabel: topic.label ?? topic.topicLabel ?? topic.title ?? null,
      topicPath: metadata.topicPath ?? topic.topicPath ?? topic.pathLabel ?? selectionRef.current.topicPath,
      topicLevel: metadata.topicLevel ?? topic.topicLevel ?? topic.level ?? selectionRef.current.topicLevel,
      topicPageNumber: metadata.topicPageNumber ?? topic.topicPageNumber ?? topic.page_number ?? selectionRef.current.topicPageNumber,
    }
    selectionRef.current = nextSelection
    setSelection(nextSelection)
    await saveLearningSelection(nextSelection)
  }, [])

  const value = useMemo(
    () => ({ selection, isSelectionLoaded, selectClass, selectSubject, selectTopic }),
    [selection, isSelectionLoaded, selectClass, selectSubject, selectTopic],
  )

  return (
    <LearningSelectionContext.Provider value={value}>
      {children}
    </LearningSelectionContext.Provider>
  )
}

export function useLearningSelection() {
  const context = useContext(LearningSelectionContext)
  if (!context) {
    throw new Error('useLearningSelection must be used inside LearningSelectionProvider')
  }
  return context
}
