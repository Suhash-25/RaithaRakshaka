const fs = require('fs')
const path = require('path')

const DATASET_DIR = path.join(__dirname, '../dataset')
const CATALOGS_DIR = path.join(__dirname, '../frontend/src/data/catalogs')
const REGISTRY_FILE = path.join(__dirname, '../frontend/src/data/catalogRegistry.js')
const API_FILE = path.join(__dirname, '../frontend/src/services/api.js')

// Helper to convert Roman numerals to integers
function romanToInt(s) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let sum = 0
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]]
    const next = map[s[i + 1]]
    if (next && cur < next) {
      sum += next - cur
      i++
    } else {
      sum += cur
    }
  }
  return sum
}

function toSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function parseFilename(filename, classRoman) {
  // e.g. "Biology Textbook XII.pdf" -> Subject: Biology, Kind: Textbook
  const cleanName = filename.replace(/\.pdf$/i, '').trim()
  
  // Try to extract subject
  // Common patterns: "Subject Textbook Part - X Class.pdf" or "Subject Textbook Class.pdf"
  let subjectStr = cleanName
  let kind = 'reader'
  
  if (cleanName.toLowerCase().includes('textbook')) {
    kind = 'textbook'
    subjectStr = cleanName.split(/textbook/i)[0].trim()
  } else if (cleanName.toLowerCase().includes('workbook')) {
    kind = 'workbook'
    subjectStr = cleanName.split(/workbook/i)[0].trim()
  }
  
  // If subject is something like "Maths", change it to "Mathematics"
  if (subjectStr.toLowerCase() === 'maths') subjectStr = 'Mathematics'
  
  return { subject: subjectStr, kind }
}

function generateCatalogContent(classSlug, classLabel, subjectSlug, subjectLabel) {
  const exportName = `${subjectSlug.toUpperCase().replace(/-/g, '_')}_${classSlug.toUpperCase().replace(/-/g, '_')}`
  
  return `/**
 * Generated Catalog: ${classLabel} - ${subjectLabel}
 */
export const ${exportName} = {
  classId: '${classSlug}',
  classLabel: '${classLabel}',
  subject: '${subjectLabel}',
  board: 'State Board',
  chapters: [
    {
      id: 'ch1',
      number: 1,
      title: 'Introduction to ${subjectLabel}',
      topics: [
        {
          id: 'ch1-t1',
          title: 'Basic Concepts',
          duration: '15 min',
          difficulty: 'foundation',
          animationType: '${subjectSlug}Intro',
          learningObjectives: [
            'Understand the basic concepts of ${subjectLabel}',
            'Apply fundamental principles to solve simple problems',
          ],
          mcq: [
            {
              id: 'ch1-t1-mcq1',
              text: 'What is the primary focus of this chapter?',
              options: ['Core principles', 'Advanced theories', 'Historical background', 'Practical applications'],
              correctIndex: 0,
              explanation: 'This introductory chapter focuses on core principles.'
            }
          ],
          numerical: [],
          questions: [
            {
              id: 'ch1-t1-q1',
              text: 'Explain the fundamental importance of ${subjectLabel} in everyday life.',
              hint: 'Think about practical examples where you observe these phenomena.',
              expectedConcepts: ['practical application', 'everyday observation'],
              estimatedTime: '3 min',
            }
          ],
          misconceptions: [
            {
              id: 'ch1-t1-m1',
              probe: 'Do you think ${subjectLabel} is only theoretical and has no real-world use?',
              options: ['Yes, it is mostly abstract', 'No, it applies directly to reality'],
              correctIndex: 1,
              correction: '${subjectLabel} provides the foundational rules governing real-world interactions.',
              detectKeywords: ['abstract', 'theoretical', 'not practical'],
            }
          ],
        }
      ]
    }
  ]
}
`
}

async function main() {
  if (!fs.existsSync(DATASET_DIR)) {
    console.error('Dataset directory not found!')
    return
  }

  const classes = fs.readdirSync(DATASET_DIR)
    .filter(dir => dir.startsWith('Class '))
    .map(dir => {
      const roman = dir.replace('Class ', '').trim()
      const intNum = romanToInt(roman)
      return { dir, roman, intNum }
    })
    .sort((a, b) => b.intNum - a.intNum)

  const offlineCatalog = {
    total_pages: 5000,
    classes: []
  }
  
  const lazyLoaders = []

  for (const c of classes) {
    const classPath = path.join(DATASET_DIR, c.dir)
    const files = fs.readdirSync(classPath).filter(f => f.endsWith('.pdf'))
    
    // Group files by subject
    const subjectsMap = {}
    
    for (const file of files) {
      const { subject, kind } = parseFilename(file, c.roman)
      const subjectSlug = toSlug(subject)
      
      if (!subjectsMap[subjectSlug]) {
        subjectsMap[subjectSlug] = {
          subject_slug: subjectSlug,
          subject_label: subject,
          total_pages: 200,
          document_count: 0,
          chapter_count: 10,
          documents: []
        }
      }
      
      subjectsMap[subjectSlug].documents.push({
        document_title: file.replace('.pdf', ''),
        document_kind: kind
      })
      subjectsMap[subjectSlug].document_count++
    }

    const classSlug = `class-${c.intNum.toString().padStart(2, '0')}`
    
    // Ensure catalog directory exists for class
    const classCatalogDir = path.join(CATALOGS_DIR, classSlug)
    if (!fs.existsSync(classCatalogDir)) {
      fs.mkdirSync(classCatalogDir, { recursive: true })
    }

    const subjectsArray = Object.values(subjectsMap)
    
    for (const subject of subjectsArray) {
      // 1. Generate specific catalog file
      const filePath = path.join(classCatalogDir, `${subject.subject_slug}.js`)
      // Only generate if it doesn't already exist to prevent overwriting custom ones like physicsClass12Catalog.js
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, generateCatalogContent(classSlug, c.dir, subject.subject_slug, subject.subject_label))
      }
      
      // 2. Add to lazy loaders
      lazyLoaders.push({
        key: `'${classSlug}:${subject.subject_slug}'`,
        importPath: `'./catalogs/${classSlug}/${subject.subject_slug}'`
      })
    }

    offlineCatalog.classes.push({
      class_slug: classSlug,
      class_label: c.dir,
      total_pages: subjectsArray.length * 200,
      subject_count: subjectsArray.length,
      subjects: subjectsArray
    })
  }

  // UPDATE catalogRegistry.js
  let registryContent = fs.readFileSync(REGISTRY_FILE, 'utf-8')
  
  // Replace lazy loaders block
  const loadersString = lazyLoaders.map(l => `  ${l.key}: () => import(${l.importPath}),`).join('\n')
  registryContent = registryContent.replace(
    /const LAZY_CATALOG_LOADERS = {[\s\S]*?}/,
    `const LAZY_CATALOG_LOADERS = {\n${loadersString}\n}`
  )
  fs.writeFileSync(REGISTRY_FILE, registryContent)

  // UPDATE api.js FALLBACK_CATALOG
  let apiContent = fs.readFileSync(API_FILE, 'utf-8')
  // Find where const FALLBACK_CATALOG starts and ends
  const catalogRegex = /const FALLBACK_CATALOG = {[\s\S]*?}\n\nexport async function getSyllabusCatalog\(\) {/
  const newCatalogString = `const FALLBACK_CATALOG = ${JSON.stringify(offlineCatalog, null, 2)}\n\nexport async function getSyllabusCatalog() {`
  
  apiContent = apiContent.replace(catalogRegex, newCatalogString)
  fs.writeFileSync(API_FILE, apiContent)

  console.log('Successfully generated catalogs and updated registry/fallback!')
}

main()
