import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookCopy,
  ChevronDown,
  ChevronRight,
  FileText,
  LoaderCircle,
  Search,
} from 'lucide-react'
import { getSyllabusDocument } from '@/services/api'
import { useLearningSelection } from '@/context/LearningSelectionContext'
import {
  calculateDocumentCoverage,
  formatCompactNumber,
  formatFileSize,
  getSubjectVisual,
} from '@/utils/syllabus'
import { buildSyllabusPracticeTree } from '@/utils/syllabusPractice'

const TOC_QUALITY_COPY = {
  none: 'No embedded bookmarks were found in this PDF.',
  flat: 'A flat list of chapter markers was extracted from the PDF bookmarks.',
  structured: 'A nested syllabus tree was extracted from the PDF bookmarks.',
  page_index: 'The PDF mostly exposes page-style markers, so chapter quality is limited.',
}

const FALLBACK_TOC_COPY = 'No embedded bookmarks were found in this PDF, so Pragna Vistara inferred practice sections from the page range.'

export default function TopicsPage() {
  const navigate = useNavigate()
  const { classSlug, subjectSlug, documentId } = useParams()
  const { selectTopic } = useLearningSelection()

  const [documentData, setDocumentData] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(documentId))
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState([])

  // Redirect Class 12 Physics to the new interactive curriculum
  useEffect(() => {
    if (classSlug === 'class-xii' && subjectSlug === 'physics') {
      navigate('/physics/class-12', { replace: true })
    }
  }, [classSlug, subjectSlug, navigate])

  useEffect(() => {
    let cancelled = false

    if (!documentId) {
      setIsLoading(false)
      return undefined
    }

    async function loadDocument() {
      setIsLoading(true)
      setError('')

      try {
        const payload = await getSyllabusDocument(documentId)
        if (!cancelled) {
          setDocumentData(payload)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message ?? 'Could not load the textbook chapter map.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDocument()

    return () => {
      cancelled = true
    }
  }, [documentId])

  const tocNodes = useMemo(() => buildSyllabusPracticeTree(documentData), [documentData])
  const totalNodes = useMemo(() => flattenTocNodes(tocNodes).length, [tocNodes])
  const filteredNodes = useMemo(() => filterTocNodes(tocNodes, searchQuery), [tocNodes, searchQuery])
  const filteredNodeCount = useMemo(() => flattenTocNodes(filteredNodes).length, [filteredNodes])
  const deepestLevel = useMemo(
    () => flattenTocNodes(tocNodes).reduce((maxLevel, node) => Math.max(maxLevel, node.level ?? 1), 0),
    [tocNodes],
  )
  const leafCount = useMemo(
    () => flattenTocNodes(tocNodes).filter((node) => !node.children?.length).length,
    [tocNodes],
  )

  useEffect(() => {
    setExpandedIds(getInitialExpandedIds(tocNodes))
  }, [tocNodes])

  const subjectVisual = getSubjectVisual(documentData?.subject_slug, documentData?.subject_label)
  const SubjectIcon = subjectVisual.Icon
  const bookmarkCoverage = calculateDocumentCoverage(documentData?.toc_entry_count ?? 0, documentData?.page_count ?? 0)
  const hasInferredTree = Boolean(documentData && documentData.toc_entry_count === 0 && tocNodes.length > 0)
  const qualityDescription = hasInferredTree
    ? FALLBACK_TOC_COPY
    : TOC_QUALITY_COPY[documentData?.toc_quality] ?? TOC_QUALITY_COPY.none
  const hasSearch = searchQuery.trim().length > 0

  function handleToggleNode(nodeId) {
    setExpandedIds((currentIds) => (
      currentIds.includes(nodeId)
        ? currentIds.filter((id) => id !== nodeId)
        : [...currentIds, nodeId]
    ))
  }

  function handleExpandAll() {
    setExpandedIds(flattenTocNodes(tocNodes).filter((node) => node.children?.length).map((node) => node.id))
  }

  function handleCollapseAll() {
    setExpandedIds(getInitialExpandedIds(tocNodes))
  }

  async function handleStartPractice(node) {
    const topicState = {
      classSlug: node.classSlug,
      classLabel: node.classLabel,
      subjectId: node.subjectId,
      subjectLabel: node.subjectLabel,
      documentId: node.documentId,
      documentTitle: node.documentTitle,
      chapterId: node.chapterId,
      chapterLabel: node.chapterLabel,
      topicId: node.topicId,
      topicLabel: node.topicLabel,
      topicPath: node.topicPath,
      topicLevel: node.topicLevel,
      topicPageNumber: node.topicPageNumber,
    }

    await selectTopic(
      {
        subject_slug: node.subjectId,
        subject_label: node.subjectLabel,
      },
      {
        id: node.topicId,
        label: node.topicLabel,
      },
      topicState,
    )

    navigate(`/topics/${node.topicId}/learn`, {
      state: topicState,
    })
  }

  if (!classSlug || !subjectSlug || !documentId) {
    return (
      <div className="container-page animate-fade-in">
        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-8 text-center">
          <h1 className="text-2xl font-display font-bold text-surface-text">Choose a document first</h1>
          <p className="mt-3 text-surface-muted">
            The chapter tree opens after a class, subject, and textbook are selected.
          </p>
          <button
            type="button"
            onClick={() => navigate('/selection')}
            className="btn-primary mt-6"
          >
            Back to syllabus dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page animate-fade-in">
      <button onClick={() => navigate(`/classes/${classSlug}/subjects/${subjectSlug}`)} className="btn-ghost mb-6 pl-0">
        <ArrowLeft size={18} className="mr-1" />
        Back to documents
      </button>

      <section className="mb-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${subjectVisual.bg} ${subjectVisual.border}`}>
                <SubjectIcon size={30} className={subjectVisual.accent} />
              </div>
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="badge-primary">{documentData?.class_label ?? classSlug}</span>
                  {documentData?.part_label && <span className="badge-amber">{documentData.part_label}</span>}
                  {documentData?.document_kind && <span className="badge-teal capitalize">{documentData.document_kind}</span>}
                </div>
                <h1 className="text-3xl font-display font-bold text-surface-text sm:text-4xl">
                  {documentData?.document_title ?? documentId}
                </h1>
                <p className="mt-2 max-w-2xl text-surface-muted">
                  Explore the extracted chapter structure, inspect bookmark depth, and see where this document fits inside the subject syllabus.
                </p>
              </div>
            </div>
            {isLoading && <LoaderCircle className="h-5 w-5 animate-spin text-primary-500" />}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Pages" value={formatCompactNumber(documentData?.page_count ?? 0)} />
            <MetricCard label={hasInferredTree ? 'Sections' : 'Chapters'} value={formatCompactNumber(hasInferredTree ? tocNodes.length : documentData?.chapter_count ?? 0)} />
            <MetricCard label={hasInferredTree ? 'Topics' : 'Markers'} value={formatCompactNumber(hasInferredTree ? totalNodes : documentData?.toc_entry_count ?? 0)} />
            <MetricCard label="Depth" value={deepestLevel || 0} />
          </div>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-text">Extraction quality</h2>
            {documentData?.toc_quality && (
              <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1 text-xs font-medium text-surface-muted">
                {hasInferredTree ? 'inferred sections' : documentData.toc_quality.replace('_', ' ')}
              </span>
            )}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-surface-muted">
            {qualityDescription}
          </p>

          <div className="mt-5 space-y-4">
            <VisualStat label="Bookmark coverage" value={`${bookmarkCoverage}% intensity`} width={`${bookmarkCoverage}%`} />
            <VisualStat
              label="Leaf topics"
              value={`${leafCount} terminal nodes`}
              width={`${totalNodes ? Math.round((leafCount / totalNodes) * 100) : 0}%`}
            />
            <VisualStat
              label="Top-level chapters"
              value={`${tocNodes.length} roots`}
              width={`${totalNodes ? Math.round((tocNodes.length / totalNodes) * 100) : 0}%`}
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <article className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-surface-text">Interactive chapter tree</h2>
              <p className="mt-1 text-sm text-surface-muted">
                Search chapter titles, expand nested sections, and launch practice prompts directly from the extracted syllabus tree.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleExpandAll} className="btn-secondary px-4 py-2 text-xs">
                Expand all
              </button>
              <button type="button" onClick={handleCollapseAll} className="btn-secondary px-4 py-2 text-xs">
                Reset view
              </button>
            </div>
          </div>

          <div className="relative mb-5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-muted">
              <Search size={16} />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search chapter titles..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2 text-xs text-surface-muted">
            <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1">
              {hasSearch ? `${filteredNodeCount} matches` : `${totalNodes} extracted nodes`}
            </span>
            <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1">
              {tocNodes.length} root {hasInferredTree ? 'sections' : 'chapters'}
            </span>
            <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1">
              Deepest level {deepestLevel || 0}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-surface-border bg-surface/60 p-4">
                  <div className="skeleton mb-3 h-5 w-48" />
                  <div className="skeleton h-4 w-24" />
                </div>
              ))}
            </div>
          ) : tocNodes.length === 0 ? (
            <EmptyTocState />
          ) : filteredNodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface-border bg-surface/50 px-4 py-10 text-center text-sm text-surface-muted">
              No chapter titles matched "{searchQuery}".
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNodes.map((node) => (
                <TocTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  searchQuery={searchQuery}
                  expandedIds={expandedIds}
                  onToggle={handleToggleNode}
                  onStartPractice={handleStartPractice}
                />
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
          <h2 className="text-xl font-semibold text-surface-text">Document summary</h2>
          <p className="mt-1 text-sm text-surface-muted">
            Useful metadata for future indexing, search, and curriculum enrichment.
          </p>

          <div className="mt-5 space-y-3">
            <InfoCard
              icon={BookCopy}
              label="Subject"
              value={documentData?.subject?.label ?? documentData?.subject_label ?? subjectSlug}
              hint={documentData?.subject_slug ?? subjectSlug}
            />
            <InfoCard
              icon={FileText}
              label="Source file"
              value={documentData?.file_name ?? 'Unknown file'}
              hint={documentData?.relative_pdf_path ?? 'Path unavailable'}
            />
          </div>

          <div className="divider" />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <DetailTile label="File size" value={formatFileSize(documentData?.file_size_bytes ?? 0)} />
            <DetailTile label="TOC entries" value={formatCompactNumber(documentData?.toc_entry_count ?? 0)} />
            <DetailTile label="Page count" value={formatCompactNumber(documentData?.page_count ?? 0)} />
            <DetailTile label="Updated" value={formatDate(documentData?.modified_at)} />
          </div>

          <div className="divider" />

          <div className="rounded-2xl border border-surface-border bg-surface/50 p-4">
            <p className="text-sm font-semibold text-surface-text">Pipeline note</p>
            <p className="mt-2 text-sm leading-relaxed text-surface-muted">
              Documents without a usable TOC should move through a second enrichment pass that infers chapter headings from extracted page text instead of relying only on PDF bookmarks.
            </p>
          </div>
        </article>
      </section>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-surface-muted">{label}</p>
      <p className="mt-2 text-2xl font-display font-bold text-surface-text">{value}</p>
    </div>
  )
}

function VisualStat({ label, value, width }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-surface-muted">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="progress-track h-2">
        <div className="progress-fill" style={{ width }} />
      </div>
    </div>
  )
}

function DetailTile({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-surface-muted">{label}</p>
      <p className="mt-2 text-base font-semibold text-surface-text">{value}</p>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface-card">
          <Icon size={18} className="text-primary-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.08em] text-surface-muted">{label}</p>
          <p className="mt-1 text-sm font-semibold text-surface-text">{value}</p>
          <p className="mt-1 truncate text-xs text-surface-muted">{hint}</p>
        </div>
      </div>
    </div>
  )
}

function EmptyTocState() {
  return (
    <div className="rounded-2xl border border-dashed border-surface-border bg-surface/50 p-6">
      <h3 className="text-lg font-semibold text-surface-text">No embedded chapter tree yet</h3>
      <p className="mt-2 text-sm leading-relaxed text-surface-muted">
        This PDF does not expose a usable bookmark outline, so the chapter map cannot be drawn from the current extraction step alone.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <FallbackTile title="Text extraction" body="Extract page text and headings with layout-aware parsing." />
        <FallbackTile title="Heading inference" body="Detect chapter titles from typography, numbering, and repetition." />
        <FallbackTile title="Page ranges" body="Map inferred chapters back to page spans for progress tracking." />
      </div>
    </div>
  )
}

function FallbackTile({ title, body }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface px-4 py-4">
      <p className="text-sm font-semibold text-surface-text">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-surface-muted">{body}</p>
    </div>
  )
}

function TocTreeNode({ node, depth, searchQuery, expandedIds, onToggle, onStartPractice }) {
  const hasChildren = Boolean(node.children?.length)
  const isExpanded = searchQuery.trim() ? true : expandedIds.includes(node.id)

  const content = (
    <div className="flex items-start gap-3" style={{ paddingLeft: `${depth * 0.75}rem` }}>
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface-card text-surface-muted">
        {hasChildren ? (
          isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />
        ) : (
          <span className="text-[10px] font-semibold">{node.level}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-relaxed text-surface-text">
          <HighlightedText text={node.title} query={searchQuery} />
        </p>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-surface-muted">
          <span className="rounded-full border border-surface-border bg-surface px-2 py-0.5">
            Level {node.level}
          </span>
          {node.page_number && (
            <span className="rounded-full border border-surface-border bg-surface px-2 py-0.5">
              Page {node.page_number}
            </span>
          )}
          {hasChildren && (
            <span className="rounded-full border border-surface-border bg-surface px-2 py-0.5">
              {node.children.length} subtopic{node.children.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="rounded-2xl border border-surface-border bg-surface/60 p-4 transition-colors hover:border-primary-500">
        {hasChildren ? (
          <button type="button" onClick={() => onToggle(node.id)} className="w-full text-left">
            {content}
          </button>
        ) : (
          content
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
          <span className="text-xs text-surface-muted">
            {hasChildren ? 'Practice this section or drill into its subtopics.' : 'Ready for a focused practice prompt.'}
          </span>
          <button
            type="button"
            onClick={() => onStartPractice(node)}
            className="btn-secondary px-4 py-2 text-xs"
          >
            Practice {hasChildren ? 'section' : 'topic'}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-4 mt-2 space-y-2 border-l border-surface-border/80 pl-4">
          {node.children.map((child) => (
            <TocTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onStartPractice={onStartPractice}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HighlightedText({ text, query }) {
  const needle = query.trim().toLowerCase()
  if (!needle) return text

  const segments = []
  const lowerText = text.toLowerCase()
  let cursor = 0

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(needle, cursor)
    if (matchIndex === -1) {
      segments.push({ value: text.slice(cursor), match: false })
      break
    }

    if (matchIndex > cursor) {
      segments.push({ value: text.slice(cursor, matchIndex), match: false })
    }

    segments.push({
      value: text.slice(matchIndex, matchIndex + needle.length),
      match: true,
    })
    cursor = matchIndex + needle.length
  }

  return segments.map((segment, index) => (
    <span
      key={`${segment.value}-${index}`}
      className={segment.match ? 'rounded bg-surface-card px-1 text-primary-500' : undefined}
    >
      {segment.value}
    </span>
  ))
}

function filterTocNodes(nodes, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return nodes

  return nodes.reduce((matches, node) => {
    const filteredChildren = filterTocNodes(node.children ?? [], query)
    const currentMatches = node.title.toLowerCase().includes(needle)

    if (currentMatches || filteredChildren.length > 0) {
      matches.push({
        ...node,
        children: filteredChildren,
      })
    }

    return matches
  }, [])
}

function flattenTocNodes(nodes) {
  return nodes.flatMap((node) => [node, ...flattenTocNodes(node.children ?? [])])
}

function getInitialExpandedIds(nodes) {
  return flattenTocNodes(nodes)
    .filter((node) => node.children?.length && node.level <= 2)
    .map((node) => node.id)
}

function formatDate(value) {
  if (!value) return 'Unknown'

  try {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}
