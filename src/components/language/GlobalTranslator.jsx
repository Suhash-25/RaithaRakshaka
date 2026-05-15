import { useEffect } from 'react'
import { translatePhrase } from '@/utils/translations'
import { useLanguage } from '@/context/LanguageContext'

const originalText = new WeakMap()
const originalAttributes = new WeakMap()
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt']
const SKIP_TEXT_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE'])

export default function GlobalTranslator() {
  const { language } = useLanguage()

  useEffect(() => {
    let isApplying = false

    function translateNode(node) {
      if (!node) return

      if (node.nodeType === Node.TEXT_NODE) {
        if (shouldSkipText(node)) return
        translateTextNode(node)
        return
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return

      translateAttributes(node)
      if (shouldSkipText(node)) return
      node.childNodes.forEach(translateNode)
    }

    function translateTextNode(node) {
      const text = node.textContent
      if (!text || !text.trim()) return

      if (!originalText.has(node)) {
        originalText.set(node, text)
      }

      const source = originalText.get(node)
      const translated = translatePhrase(language, source)
      if (node.textContent !== translated) {
        node.textContent = translated
      }
    }

    function translateAttributes(element) {
      const originals = originalAttributes.get(element) ?? {}
      let changed = false

      TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        const current = element.getAttribute(attribute)
        if (!current || !current.trim()) return

        if (!originals[attribute]) {
          originals[attribute] = current
          changed = true
        }

        const translated = translatePhrase(language, originals[attribute])
        if (current !== translated) {
          element.setAttribute(attribute, translated)
        }
      })

      if (changed && !originalAttributes.has(element)) {
        originalAttributes.set(element, originals)
      }
    }

    function applyTranslations(target = document.body) {
      isApplying = true
      translateNode(target)
      window.setTimeout(() => {
        isApplying = false
      }, 0)
    }

    applyTranslations()

    const observer = new MutationObserver((mutations) => {
      if (isApplying) return

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(applyTranslations)
        }

        if (mutation.type === 'characterData') {
          originalText.delete(mutation.target)
          applyTranslations(mutation.target)
        }

        if (mutation.type === 'attributes') {
          originalAttributes.delete(mutation.target)
          applyTranslations(mutation.target)
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    })

    return () => observer.disconnect()
  }, [language])

  return null
}

function shouldSkipText(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
  return !element || element.closest('[data-no-translate]') || SKIP_TEXT_TAGS.has(element.tagName)
}
