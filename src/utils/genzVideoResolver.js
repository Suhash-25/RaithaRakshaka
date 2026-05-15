/**
 * genzVideoResolver.js
 * Central utility to map topics to their respective cinematic Gen-Z animations.
 * Prioritizes high-fidelity manual HTML animations over the dynamic fallback.
 */

export function getGenZVideoPath(params) {
  // Safely extract params — guard against non-object or legacy positional-arg calls
  const safeParams = (params && typeof params === 'object') ? params : {};
  const { subject, chapterNumber, topicTitle, topicId, board, classId } = safeParams;

  // Coerce every field to a plain string before calling string methods
  const toStr = (v) => (v == null ? '' : typeof v === 'object' ? (v.label || v.name || v.title || JSON.stringify(v)) : String(v));

  const s = toStr(subject).toLowerCase();
  const t = toStr(topicTitle).toLowerCase();
  const ch = chapterNumber ? String(chapterNumber) : '1';
  const tid = toStr(topicId).toLowerCase();
  const boardType = toStr(board || 'state').toLowerCase();

  // ── CLASS 5 ENGLISH CH1 ──
  if (s === 'english' && ch === '1') {
    if (t.includes('prose') || t.includes('hero') || t.includes('introduction to prose') || tid.includes('ch1-t1')) {
      return '/genz_videos/video1_reading_prose.html';
    }
    if (t.includes('poetry') || t.includes('poem') || t.includes('reading poetry') || tid.includes('ch1-t2')) {
      return '/genz_videos/video2_reading_poetry.html';
    }
  }

  // ── EVS / ENVIRONMENTAL STUDIES (Class 1-5) ──
  if (s === 'evs' || s === 'environmental studies') {
    if (ch === '1') {
      if (t.includes('introduction') || t.includes('intro') || tid.includes('ch1-t1')) {
        return '/genz_videos/evs_family_intro.html';
      }
      if (t.includes('advanced') || t.includes('concepts') || t.includes('relationship') || tid.includes('ch1-t2')) {
        return '/genz_videos/evs_family_advanced.html';
      }
    }
  }

  // ── UNIVERSAL DYNAMIC FALLBACK ──
  // Passes full context to the dynamic engine which uses GSAP to generate an animation on-the-fly.
  const lang = ['hindi','kannada','sanskrit','urdu','marathi','telugu','tamil'].includes(s) ? s : 'english';
  const clsNum = classId ? classId.replace(/[^0-9]/g, '') : '9';
  
  const query = new URLSearchParams({
    title: toStr(topicTitle),
    subject: toStr(subject),
    lang: lang,
    tid: toStr(topicId),
    board: boardType,
    ch: ch,
    cls: clsNum
  }).toString();

  return `/genz_videos/dynamic_player.html?${query}`;
}
