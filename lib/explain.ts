import {useCallback, useRef, useState} from 'react';
import type {MessageKey} from './i18n';

export interface ExplainInput {
  id: string;
  en: string;
  ar?: string;
  la?: string;
  system?: string;
  locale: 'ar' | 'en';
}

type Phase = 'idle' | 'offline' | 'loading' | 'ready' | 'error';

const ERRORS: Record<string, MessageKey> = {
  offline: 'explain.errorOffline',
  not_configured: 'explain.errorUnavailable',
  rate_limited: 'explain.errorBusy',
  refused: 'explain.errorRefused',
};

/** Drives the explain flow: offline gets an alert and nothing else; online goes
 * straight to the model and opens the explanation window. Answers are cached
 * per structure and language for the session, so reopening one costs nothing. */
export function useExplainer() {
  const cache = useRef(new Map<string, string>());
  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState<MessageKey>('explain.errorGeneric');
  const inflight = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    inflight.current?.abort();
    inflight.current = null;
    setPhase('idle');
    setText('');
  }, []);

  const run = useCallback(async (input: ExplainInput) => {
    // The browser's own connectivity flag decides: offline never reaches the
    // network, it just says so.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setPhase('offline');
      return;
    }
    const cached = cache.current.get(`${input.locale}:${input.id}`);
    if (cached) {
      setText(cached);
      setPhase('ready');
      return;
    }
    inflight.current?.abort();
    const abort = new AbortController();
    inflight.current = abort;
    setPhase('loading');
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({en: input.en, ar: input.ar, la: input.la, system: input.system, locale: input.locale}),
        signal: abort.signal,
      });
      const data = (await response.json().catch(() => ({}))) as {text?: string; error?: string};
      if (!response.ok || !data.text) {
        setError(ERRORS[data.error ?? ''] ?? 'explain.errorGeneric');
        setPhase('error');
        return;
      }
      cache.current.set(`${input.locale}:${input.id}`, data.text);
      setText(data.text);
      setPhase('ready');
    } catch (thrown) {
      if ((thrown as Error).name === 'AbortError') return;
      setError('explain.errorOffline');
      setPhase('error');
    }
  }, []);

  return {phase, text, error, start: run, confirm: run, reset};
}

export interface ExplainSection {
  heading: string;
  lines: string[];
}

/** Splits the model's "## heading" answer into sections for rendering.
 * Text before the first heading is kept, so an unexpected shape still shows. */
export function parseExplanation(text: string): ExplainSection[] {
  const sections: ExplainSection[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^#{1,6}\s*(.+)$/);
    if (heading) {
      sections.push({heading: heading[1].trim(), lines: []});
      continue;
    }
    if (!sections.length) sections.push({heading: '', lines: []});
    sections[sections.length - 1].lines.push(line.replace(/^[-*]\s*/, ''));
  }
  return sections.filter((section) => section.heading || section.lines.length);
}
