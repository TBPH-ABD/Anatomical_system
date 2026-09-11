import {useCallback, useEffect, useState} from 'react';

/** A structure the student saved, stored by model identifier so the record
 * survives any change to the displayed name. */
export interface SavedStructure {
  id: string;
  name: string;
  elements: string[];
}

export interface StudyList {
  id: string;
  name: string;
  members: string[];
}

export interface Flashcard extends SavedStructure {
  added: number;
  system?: string;
  /** Both scripts are kept so an exported deck stays useful in either language. */
  en: string;
  ar?: string;
}

export interface StudyState {
  favorites: SavedStructure[];
  lists: StudyList[];
  cards: Flashcard[];
}

const EMPTY: StudyState = {favorites: [], lists: [], cards: []};
const KEY = 'anatomy.study.v1';
/** The key this store used before the rename; read once so a student who
 * saved structures earlier does not lose them. */
const FORMER_KEY = 'atlas.study.v1';

function read(): StudyState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(FORMER_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StudyState>;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      lists: Array.isArray(parsed.lists) ? parsed.lists : [],
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
    };
  } catch {
    return EMPTY;
  }
}

/** Saved work lives in this browser only; storage failures are non-fatal. */
export function useStudy() {
  const [state, setState] = useState<StudyState>(EMPTY);
  useEffect(() => setState(read()), []);
  useEffect(() => {
    if (state === EMPTY) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* Quota or private mode: the session keeps working in memory. */
    }
  }, [state]);

  const isFavorite = useCallback((id: string) => state.favorites.some((f) => f.id === id), [state.favorites]);
  const toggleFavorite = useCallback((entry: SavedStructure) => {
    setState((s) =>
      s.favorites.some((f) => f.id === entry.id)
        ? {...s, favorites: s.favorites.filter((f) => f.id !== entry.id), lists: s.lists.map((l) => ({...l, members: l.members.filter((m) => m !== entry.id)}))}
        : {...s, favorites: [entry, ...s.favorites]},
    );
  }, []);

  const hasCard = useCallback((id: string) => state.cards.some((c) => c.id === id), [state.cards]);
  const addCard = useCallback((entry: Omit<Flashcard, 'added'>) => {
    setState((s) => (s.cards.some((c) => c.id === entry.id) ? s : {...s, cards: [{...entry, added: Date.now()}, ...s.cards]}));
  }, []);
  const removeCard = useCallback((id: string) => setState((s) => ({...s, cards: s.cards.filter((c) => c.id !== id)})), []);
  const clearCards = useCallback(() => setState((s) => ({...s, cards: []})), []);

  const createList = useCallback((name: string) => {
    const id = `list-${Date.now().toString(36)}`;
    setState((s) => ({...s, lists: [...s.lists, {id, name, members: []}]}));
    return id;
  }, []);
  const deleteList = useCallback((id: string) => setState((s) => ({...s, lists: s.lists.filter((l) => l.id !== id)})), []);
  const toggleMember = useCallback((listId: string, structureId: string) => {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) =>
        l.id !== listId
          ? l
          : {...l, members: l.members.includes(structureId) ? l.members.filter((m) => m !== structureId) : [...l.members, structureId]},
      ),
    }));
  }, []);

  return {...state, isFavorite, toggleFavorite, hasCard, addCard, removeCard, clearCards, createList, deleteList, toggleMember};
}

/** CSV for spreadsheets, and a tab-separated file Anki imports directly. */
export function exportCards(cards: Flashcard[], columns: [string, string, string], separator: ',' | '\t'): string {
  const escape = (value: string) =>
    separator === ',' && /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value.replace(/[\t\n]/g, ' ');
  const rows = cards.map((card) => [card.ar ?? card.name, card.en, card.id].map(escape).join(separator));
  return [columns.map(escape).join(separator), ...rows].join('\n');
}
