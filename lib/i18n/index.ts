import {createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';
import {en} from './en';
import {ar} from './ar';
import type {Direction, Locale, Translation} from './types';
import type {Messages} from './en';

export type {Direction, Locale} from './types';
export type {Messages} from './en';

const BUNDLES: Record<Locale, Translation<Messages>> = {en, ar};
const DIRECTION: Record<Locale, Direction> = {ar: 'rtl', en: 'ltr'};
const STORAGE_KEY = 'atlas.locale';

/** Dot-separated paths into the message bundle, e.g. `detail.isolate`. */
type Leaves<T> = T extends string ? '' : {[K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`}[keyof T & string];
export type MessageKey = Leaves<Messages>;

function lookup(bundle: unknown, key: string): string | undefined {
  let node: unknown = bundle;
  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Western Arabic digits everywhere: they match the atlas identifiers students
 * read alongside them, and Arabic medical curricula use them too. */
const NUMBERS = new Intl.NumberFormat('en-US');
export const formatNumber = (value: number) => NUMBERS.format(value);

export function translate(locale: Locale, key: MessageKey, params?: Record<string, string | number>): string {
  const text = lookup(BUNDLES[locale], key) ?? lookup(BUNDLES.en, key) ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return typeof value === 'number' ? formatNumber(value) : value;
  });
}

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'ar';
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {
    /* Private browsing modes can refuse storage; the Arabic default still applies. */
  }
  return 'ar';
}

export interface I18n {
  locale: Locale;
  dir: Direction;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  n: (value: number) => string;
  setLocale: (next: Locale) => void;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({children}: {children: ReactNode}) {
  const [locale, setLocale] = useState<Locale>(detectLocale);
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = DIRECTION[locale];
    document.title = translate(locale, 'meta.title');
    document.querySelector('meta[name=description]')?.setAttribute('content', translate(locale, 'meta.description'));
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* Storage is optional; the language still applies for this session. */
    }
  }, [locale]);
  const value = useMemo<I18n>(
    () => ({
      locale,
      dir: DIRECTION[locale],
      t: (key, params) => translate(locale, key, params),
      n: formatNumber,
      setLocale,
    }),
    [locale],
  );
  return createElement(I18nContext.Provider, {value}, children);
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>.');
  return value;
}

/** Stable `t` for effects that should not re-run on every render. */
export function useTranslator() {
  const {locale} = useI18n();
  return useCallback(
    (key: MessageKey, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );
}
