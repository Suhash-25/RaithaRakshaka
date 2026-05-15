/**
 * globalCatalogLoader.js
 * Utility to load the main catalogs.json and find topics/chapters across all boards.
 */

let globalCatalog = null;

export async function loadGlobalCatalog() {
  if (globalCatalog) return globalCatalog;
  try {
    const res = await fetch('/assets/data/catalogs.json');
    if (!res.ok) return null;
    globalCatalog = await res.json();
    return globalCatalog;
  } catch (e) {
    console.error('[GlobalCatalog] Failed to load:', e);
    return null;
  }
}

export function findTopicInGlobalCatalog(catalog, classId, subjectId, topicTitle) {
  if (!catalog) return null;
  
  // Find the class
  const classData = catalog.classes?.find(c => c.classId === classId);
  if (!classData) return null;
  
  // Find the subject
  const subjectData = classData.subjects?.find(s => s.subjectId === subjectId || s.subject.toLowerCase() === subjectId.toLowerCase());
  if (!subjectData) return null;
  
  // Search through chapters
  for (const chapter of subjectData.chapters || []) {
    const topic = chapter.topics?.find(t => t.title.toLowerCase() === topicTitle.toLowerCase() || t.id.includes(topicTitle.toLowerCase()));
    if (topic) return topic;
  }
  
  return null;
}
