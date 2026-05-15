import {
  getCatalogKey,
  getEagerCatalog,
  loadCatalog as loadStateCatalog,
  hasCatalog as hasStateCatalog,
  getCatalogChapter,
  getCatalogTopic,
  getAllLoadedCatalogs,
} from './State/catalogRegistry'
import { enrichStateCatalog, getCbseCatalog, getStateCatalog, normalizeClassId } from './syllabusBoards'

export {
  getCatalogKey,
  getEagerCatalog,
  getCatalogChapter,
  getCatalogTopic,
  getAllLoadedCatalogs,
}

export async function loadCatalog(classId, subjectId, boardId = 'state') {
  if (boardId === 'cbse') {
    return getCbseCatalog(normalizeClassId(classId), subjectId)
  }

  const generatedCatalog = await loadStateCatalog(classId, subjectId)
  return generatedCatalog ? enrichStateCatalog(generatedCatalog) : getStateCatalog(classId, subjectId)
}

export function hasCatalog(classId, subjectId, boardId = 'state') {
  if (boardId === 'cbse') {
    return Boolean(getCbseCatalog(normalizeClassId(classId), subjectId))
  }

  return hasStateCatalog(classId, subjectId) || Boolean(getStateCatalog(classId, subjectId))
}
