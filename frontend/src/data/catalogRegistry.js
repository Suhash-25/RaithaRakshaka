/**
 * catalogRegistry.js
 * Central registry for all catalogs (CBSE and State).
 * Maps (boardId, classId, subjectId) → catalog object.
 */

import { getBoardInteractiveCatalog, hasBoardInteractiveCatalog } from './boardSyllabus'

const EAGER_CATALOGS = {
}

const LAZY_CATALOG_LOADERS = {
  'state:class-12:biology': () => import('./State/catalogs/class-12/biology'),
  'state:class-12:chemistry': () => import('./State/catalogs/class-12/chemistry'),
  'state:class-12:computer-science': () => import('./State/catalogs/class-12/computer-science'),
  'state:class-12:electronics': () => import('./State/catalogs/class-12/electronics'),
  'state:class-12:english': () => import('./State/catalogs/class-12/english'),
  'state:class-12:hindi': () => import('./State/catalogs/class-12/hindi'),
  'state:class-12:kannada': () => import('./State/catalogs/class-12/kannada'),
  'state:class-12:mathematics': () => import('./State/catalogs/class-12/mathematics'),
  'state:class-12:physics': () => import('./State/catalogs/class-12/physics'),
  'state:class-12:sanskrit': () => import('./State/catalogs/class-12/sanskrit'),
  'state:class-11:biology': () => import('./State/catalogs/class-11/biology'),
  'state:class-11:chemistry': () => import('./State/catalogs/class-11/chemistry'),
  'state:class-11:computer-science': () => import('./State/catalogs/class-11/computer-science'),
  'state:class-11:electronics': () => import('./State/catalogs/class-11/electronics'),
  'state:class-11:english': () => import('./State/catalogs/class-11/english'),
  'state:class-11:hindi': () => import('./State/catalogs/class-11/hindi'),
  'state:class-11:kannada': () => import('./State/catalogs/class-11/kannada'),
  'state:class-11:mathematics': () => import('./State/catalogs/class-11/mathematics'),
  'state:class-11:physics': () => import('./State/catalogs/class-11/physics'),
  'state:class-11:sanskrit': () => import('./State/catalogs/class-11/sanskrit'),
  'state:class-10:english': () => import('./State/catalogs/class-10/english'),
  'state:class-10:kannada': () => import('./State/catalogs/class-10/kannada'),
  'state:class-10:mathematics': () => import('./State/catalogs/class-10/mathematics'),
  'state:class-10:physical-education': () => import('./State/catalogs/class-10/physical-education'),
  'state:class-10:sanskrit': () => import('./State/catalogs/class-10/sanskrit'),
  'state:class-10:science': () => import('./State/catalogs/class-10/science'),
  'state:class-10:social-science': () => import('./State/catalogs/class-10/social-science'),
  'state:class-09:english': () => import('./State/catalogs/class-09/english'),
  'state:class-09:hindi': () => import('./State/catalogs/class-09/hindi'),
  'state:class-09:kannada': () => import('./State/catalogs/class-09/kannada'),
  'state:class-09:mathematics': () => import('./State/catalogs/class-09/mathematics'),
  'state:class-09:sanskrit': () => import('./State/catalogs/class-09/sanskrit'),
  'state:class-09:science': () => import('./State/catalogs/class-09/science'),
  'state:class-09:social-science': () => import('./State/catalogs/class-09/social-science'),
  'state:class-08:english': () => import('./State/catalogs/class-08/english'),
  'state:class-08:hindi': () => import('./State/catalogs/class-08/hindi'),
  'state:class-08:kannada': () => import('./State/catalogs/class-08/kannada'),
  'state:class-08:mathematics': () => import('./State/catalogs/class-08/mathematics'),
  'state:class-08:sanskrit': () => import('./State/catalogs/class-08/sanskrit'),
  'state:class-08:science': () => import('./State/catalogs/class-08/science'),
  'state:class-08:social-science': () => import('./State/catalogs/class-08/social-science'),
  'state:class-07:english': () => import('./State/catalogs/class-07/english'),
  'state:class-07:hindi': () => import('./State/catalogs/class-07/hindi'),
  'state:class-07:kannada': () => import('./State/catalogs/class-07/kannada'),
  'state:class-07:mathematics': () => import('./State/catalogs/class-07/mathematics'),
  'state:class-07:sanskrit': () => import('./State/catalogs/class-07/sanskrit'),
  'state:class-07:science': () => import('./State/catalogs/class-07/science'),
  'state:class-07:social-science': () => import('./State/catalogs/class-07/social-science'),
  'state:class-06:english': () => import('./State/catalogs/class-06/english'),
  'state:class-06:hindi': () => import('./State/catalogs/class-06/hindi'),
  'state:class-06:kannada': () => import('./State/catalogs/class-06/kannada'),
  'state:class-06:mathematics': () => import('./State/catalogs/class-06/mathematics'),
  'state:class-06:sanskrit': () => import('./State/catalogs/class-06/sanskrit'),
  'state:class-06:science': () => import('./State/catalogs/class-06/science'),
  'state:class-06:social-science': () => import('./State/catalogs/class-06/social-science'),
  'state:class-05:english': () => import('./State/catalogs/class-05/english'),
  'state:class-05:evs': () => import('./State/catalogs/class-05/evs'),
  'state:class-05:hindi': () => import('./State/catalogs/class-05/hindi'),
  'state:class-05:kannada': () => import('./State/catalogs/class-05/kannada'),
  'state:class-05:mathematics': () => import('./State/catalogs/class-05/mathematics'),
  'state:class-04:english': () => import('./State/catalogs/class-04/english'),
  'state:class-04:evs': () => import('./State/catalogs/class-04/evs'),
  'state:class-04:hindi': () => import('./State/catalogs/class-04/hindi'),
  'state:class-04:kannada': () => import('./State/catalogs/class-04/kannada'),
  'state:class-04:mathematics': () => import('./State/catalogs/class-04/mathematics'),
  'state:class-03:english': () => import('./State/catalogs/class-03/english'),
  'state:class-03:evs': () => import('./State/catalogs/class-03/evs'),
  'state:class-03:hindi': () => import('./State/catalogs/class-03/hindi'),
  'state:class-03:kannada': () => import('./State/catalogs/class-03/kannada'),
  'state:class-03:mathematics': () => import('./State/catalogs/class-03/mathematics'),
  'state:class-02:english': () => import('./State/catalogs/class-02/english'),
  'state:class-02:evs': () => import('./State/catalogs/class-02/evs'),
  'state:class-02:hindi': () => import('./State/catalogs/class-02/hindi'),
  'state:class-02:kannada': () => import('./State/catalogs/class-02/kannada'),
  'state:class-02:mathematics': () => import('./State/catalogs/class-02/mathematics'),
  'state:class-01:english': () => import('./State/catalogs/class-01/english'),
  'state:class-01:evs': () => import('./State/catalogs/class-01/evs'),
  'state:class-01:kannada': () => import('./State/catalogs/class-01/kannada'),
  'state:class-01:mathematics': () => import('./State/catalogs/class-01/mathematics'),
}

const _cache = {}

export function getCatalogKey(classId, subjectId, boardId = 'state') {
  return `${normalizeBoardId(boardId)}:${classId}:${subjectId}`
}

export function getEagerCatalog(classId, subjectId, boardId = 'state') {
  return EAGER_CATALOGS[getCatalogKey(classId, subjectId, boardId)] ?? null
}

export async function loadCatalog(classId, subjectId, boardId = 'state') {
  const safeBoardId = normalizeBoardId(boardId)
  const key = getCatalogKey(classId, subjectId, safeBoardId)

  if (EAGER_CATALOGS[key]) return EAGER_CATALOGS[key]
  if (_cache[key]) return _cache[key]

  const loader = LAZY_CATALOG_LOADERS[key]
  if (!loader) return getBoardInteractiveCatalog(classId, subjectId, safeBoardId)

  try {
    const module = await loader()
    const catalog = module.default ?? Object.values(module)[0]
    _cache[key] = catalog
    return catalog
  } catch (err) {
    console.error(`[catalogRegistry] Failed to load catalog for ${key}:`, err)
    return getBoardInteractiveCatalog(classId, subjectId, safeBoardId)
  }

  const generatedCatalog = await loadStateCatalog(classId, subjectId)
  return generatedCatalog ? enrichStateCatalog(generatedCatalog) : getStateCatalog(classId, subjectId)
}

export function hasCatalog(classId, subjectId, boardId = 'state') {
  const safeBoardId = normalizeBoardId(boardId)
  const key = getCatalogKey(classId, subjectId, safeBoardId)
  return key in EAGER_CATALOGS || key in LAZY_CATALOG_LOADERS || hasBoardInteractiveCatalog(classId, subjectId, safeBoardId)
}

export function getCatalogChapter(catalog, chapterId) {
  return catalog?.chapters?.find(c => c.id === chapterId) ?? null
}

export function getCatalogTopic(catalog, chapterId, topicId) {
  return getCatalogChapter(catalog, chapterId)?.topics?.find(t => t.id === topicId) ?? null
}

export function getAllLoadedCatalogs() {
  return [ ...Object.values(EAGER_CATALOGS), ...Object.values(_cache) ]
}

function normalizeBoardId(boardId) {
  return boardId === 'cbse' ? 'cbse' : 'state'
}
