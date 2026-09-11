import {useEffect, useState} from 'react';

/** One row of data/anatomy-terms-ar.json, keyed by model concept or mesh id. */
export interface AnatomyTerm {
  ar?: string;
  en: string;
  la?: string;
}
export type AnatomyTerms = Record<string, AnatomyTerm>;

/** Arabic search normalisation: hamza forms, tāʾ marbūṭa, alif maqṣūra,
 * diacritics and taṭwīl all collapse so "الرئه" finds "الرئة". */
export function normalizeArabic(value: string): string {
  return value
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/\s+/g, ' ')
    .trim();
}

/** One normalisation for every script the model carries. */
export const normalizeTerm = (value: string) => normalizeArabic(value.toLowerCase());

export interface TermLookup {
  /** Arabic name when one is verified, otherwise undefined. */
  arabic: (id: string, fallbackId?: string) => string | undefined;
  latin: (id: string, fallbackId?: string) => string | undefined;
  /** The name to show as the headline in the current language, never empty. */
  display: (id: string, english: string, arabicFirst: boolean, fallbackId?: string) => string;
  /** Everything searchable about an entry, already normalised. */
  haystack: (id: string, english: string, fallbackId?: string) => string;
  ready: boolean;
}

const EMPTY: AnatomyTerms = {};

function pick(terms: AnatomyTerms, id: string, fallbackId?: string): AnatomyTerm | undefined {
  return terms[id] ?? (fallbackId ? terms[fallbackId] : undefined);
}

export function createLookup(terms: AnatomyTerms, ready: boolean): TermLookup {
  const cache = new Map<string, string>();
  return {
    ready,
    arabic: (id, fallbackId) => pick(terms, id, fallbackId)?.ar,
    latin: (id, fallbackId) => pick(terms, id, fallbackId)?.la,
    display: (id, english, arabicFirst, fallbackId) => {
      if (!arabicFirst) return english;
      // Falling back to the source name is deliberate: an unverified structure
      // shows its English or Latin name rather than an invented Arabic one.
      return pick(terms, id, fallbackId)?.ar ?? english;
    },
    haystack: (id, english, fallbackId) => {
      const key = `${id}|${fallbackId ?? ''}|${english}`;
      const hit = cache.get(key);
      if (hit) return hit;
      const entry = pick(terms, id, fallbackId);
      const built = normalizeTerm([english, entry?.ar, entry?.la, id, fallbackId].filter(Boolean).join(' '));
      cache.set(key, built);
      return built;
    },
  };
}

/** Loads the Arabic terminology once. The viewer stays usable while it loads:
 * every lookup falls back to the English name until the file arrives. */
export function useAnatomyTerms(): TermLookup {
  const [terms, setTerms] = useState<AnatomyTerms>(EMPTY);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/data/anatomy-terms-ar.json', {signal: abort.signal})
      .then((response) => (response.ok ? (response.json() as Promise<AnatomyTerms>) : EMPTY))
      .then((data) => {
        setTerms(data);
        setReady(true);
      })
      .catch(() => {
        /* Terminology is an enhancement; English names remain available. */
      });
    return () => abort.abort();
  }, []);
  const [lookup, setLookup] = useState<TermLookup>(() => createLookup(EMPTY, false));
  useEffect(() => setLookup(createLookup(terms, ready)), [terms, ready]);
  return lookup;
}
