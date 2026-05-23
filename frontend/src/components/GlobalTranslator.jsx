import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { translateBatch } from '../services/api';

const TEXT_ORIGINALS = new WeakMap();
const ATTR_ORIGINALS = new WeakMap();
const TRANSLATION_CACHE = new Map();
const IN_FLIGHT = new Map();
const PERSIST_KEY = 'raitha:translationCache:v2';
const PREFETCH_LANGUAGES = ['hi', 'kn'];
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'SVG', 'PATH']);
let persistentLoaded = false;
let persistTimer = null;

function cacheKey(language, text) {
  return `${language}::${text}`;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function hasLetters(value) {
  return /[A-Za-z]/.test(value || '');
}

function hasKannada(value) {
  return /[\u0C80-\u0CFF]/.test(value || '');
}

function hasDevanagari(value) {
  return /[\u0900-\u097F]/.test(value || '');
}

function hasWrongScript(language, value) {
  if (language === 'hi') return hasKannada(value);
  if (language === 'kn') return hasDevanagari(value);
  return false;
}

function cachedTranslation(language, source) {
  const key = cacheKey(language, cleanText(source));
  const value = TRANSLATION_CACHE.get(key);
  if (value && hasWrongScript(language, value)) {
    TRANSLATION_CACHE.delete(key);
    persistCacheSoon();
    return null;
  }
  return value;
}

function loadPersistentCache() {
  if (persistentLoaded || typeof window === 'undefined') return;
  persistentLoaded = true;
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    Object.entries(parsed).forEach(([key, value]) => {
      const [language] = key.split('::');
      if (typeof value === 'string' && !hasWrongScript(language, value)) {
        TRANSLATION_CACHE.set(key, value);
      }
    });
  } catch {
    // Cache is only a speed layer; translation still works without it.
  }
}

function persistCacheSoon() {
  if (typeof window === 'undefined') return;
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      const entries = Array.from(TRANSLATION_CACHE.entries()).slice(-2500);
      localStorage.setItem(PERSIST_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      // Ignore quota/private-mode failures.
    }
  }, 350);
}

function setCached(language, source, translated) {
  const cleanSource = cleanText(source);
  if (!cleanSource) return;
  if (hasWrongScript(language, translated)) return;
  TRANSLATION_CACHE.set(cacheKey(language, cleanSource), translated || source);
  persistCacheSoon();
}

function shouldSkipElement(element) {
  if (!element) return true;
  if (SKIP_TAGS.has(element.tagName)) return true;
  return Boolean(element.closest('[data-no-translate], .notranslate, svg'));
}

function sourceForTextNode(node) {
  const current = node.textContent || '';
  const stored = TEXT_ORIGINALS.get(node);
  return stored || current;
}

function sourceForAttr(element, attr) {
  const attrs = originalAttrs(element);
  const current = element.getAttribute(attr) || '';
  const stored = attrs[attr];
  return stored || current;
}

function originalAttrs(element) {
  let stored = ATTR_ORIGINALS.get(element);
  if (!stored) {
    stored = {};
    ATTR_ORIGINALS.set(element, stored);
  }
  return stored;
}

export default function GlobalTranslator() {
  const { language } = useApp();
  const { pathname } = useLocation();
  const languageRef = useRef(language);
  const timerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    loadPersistentCache();
    languageRef.current = language;
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    const collectTargets = (root) => {
      const targets = [];

      const visitText = (node) => {
        const parent = node.parentElement;
        if (!parent || shouldSkipElement(parent)) return;
        const source = sourceForTextNode(node);
        const trimmed = cleanText(source);
        if (!trimmed || !hasLetters(trimmed)) return;
        TEXT_ORIGINALS.set(node, source);
        targets.push({ type: 'text', node, source });
      };

      const visitElement = (element) => {
        if (!element || shouldSkipElement(element)) return;
        const attrs = originalAttrs(element);
        TRANSLATABLE_ATTRS.forEach((attr) => {
          const current = element.getAttribute(attr);
          if (!current) return;
          const source = sourceForAttr(element, attr);
          const trimmed = cleanText(source);
          if (!trimmed || !hasLetters(trimmed)) return;
          attrs[attr] = source;
          targets.push({ type: 'attr', element, attr, source });
        });
      };

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
              return shouldSkipElement(node.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
            return shouldSkipElement(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
          },
        },
      );

      if (root.nodeType === Node.TEXT_NODE) visitText(root);
      if (root.nodeType === Node.ELEMENT_NODE) visitElement(root);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeType === Node.TEXT_NODE) visitText(node);
        if (node.nodeType === Node.ELEMENT_NODE) visitElement(node);
      }

      return targets;
    };

    const translateMissing = async (texts, targetLanguage) => {
      const missing = texts.filter((source) => !TRANSLATION_CACHE.has(cacheKey(targetLanguage, source)));
      if (!missing.length) return;

      const requestKey = `${targetLanguage}:${missing.join('\u001f')}`;
      if (IN_FLIGHT.has(requestKey)) {
        await IN_FLIGHT.get(requestKey);
        return;
      }

      const request = (async () => {
        for (let i = 0; i < missing.length; i += 80) {
          const slice = missing.slice(i, i + 80);
          try {
            const response = await translateBatch(slice, targetLanguage, 'en');
            const translated = response?.translated || [];
            translated.forEach((value, index) => setCached(targetLanguage, slice[index], value || slice[index]));
          } catch {
            // Keep misses uncached so a later retry can produce a real translation.
          }
        }
      })();

      IN_FLIGHT.set(requestKey, request);
      try {
        await request;
      } finally {
        IN_FLIGHT.delete(requestKey);
      }
    };

    const uniqueSources = (targets) => {
      const unique = [];
      targets.forEach((target) => {
        const source = cleanText(target.source);
        if (source && !unique.includes(source)) unique.push(source);
      });
      return unique;
    };

    const writeCachedTargets = (targets, activeLanguage) => {
      targets.forEach((target) => {
        const translated = cachedTranslation(activeLanguage, target.source);
        if (!translated) return;
        if (target.type === 'text' && target.node.textContent !== translated) {
          target.node.textContent = translated;
        }
        if (target.type === 'attr' && target.element.getAttribute(target.attr) !== translated) {
          target.element.setAttribute(target.attr, translated);
        }
      });
    };

    const prefetchTargets = async (targets) => {
      const sources = uniqueSources(targets);
      if (!sources.length) return;
      for (const lang of PREFETCH_LANGUAGES) {
        if (lang === languageRef.current) continue;
        translateMissing(sources, lang);
      }
    };

    const applyTargets = async (root = document.body) => {
      const activeLanguage = languageRef.current;
      if (!root) return;
      const targets = collectTargets(root);

      if (activeLanguage === 'en') {
        targets.forEach((target) => {
          if (target.type === 'text' && target.node.textContent !== target.source) {
            target.node.textContent = target.source;
          }
          if (target.type === 'attr' && target.element.getAttribute(target.attr) !== target.source) {
            target.element.setAttribute(target.attr, target.source);
          }
        });
        document.title = 'RaithaRakshaka AI - Farmer Intelligence Platform';
        const idle = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 250));
        idle(() => prefetchTargets(targets));
        return;
      }

      writeCachedTargets(targets, activeLanguage);
      await translateMissing(uniqueSources(targets), activeLanguage);
      if (cancelled || languageRef.current !== activeLanguage) return;

      writeCachedTargets(targets, activeLanguage);
      const idle = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 250));
      idle(() => prefetchTargets(targets));
    };

    const schedule = (root = document.body) => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => applyTargets(root), languageRef.current === 'en' ? 80 : 20);
    };

    schedule(document.body);
    observerRef.current = new MutationObserver((mutations) => {
      if (languageRef.current === 'en') {
        schedule(document.body);
        return;
      }
      const target = mutations.find((mutation) => mutation.addedNodes.length)?.target || document.body;
      schedule(target.nodeType === Node.ELEMENT_NODE ? target : document.body);
    });
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRS,
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timerRef.current);
      observerRef.current?.disconnect();
    };
  }, [language, pathname]);

  return null;
}
