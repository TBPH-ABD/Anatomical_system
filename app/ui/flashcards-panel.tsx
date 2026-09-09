import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, Download, Trash2, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useI18n} from '@/lib/i18n';
import {exportCards, type Flashcard} from '@/lib/study';

interface Props {
  cards: Flashcard[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
  onOpen: (card: Flashcard) => void;
}

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([`﻿${body}`], {type}));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** One card at a time, answer hidden until asked for: the same loop as a paper
 * deck, and the export keeps both scripts so Anki decks stay bilingual. */
export function FlashcardsPanel({cards, onRemove, onClear, onClose, onOpen}: Props) {
  const {t, n, locale} = useI18n();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setIndex((current) => (cards.length ? Math.min(current, cards.length - 1) : 0));
    setShown(false);
  }, [cards.length]);
  const card = cards[index];
  const columns: [string, string, string] = [t('detail.arabic'), t('detail.english'), t('detail.reference')];

  return (
    <section className="cards-panel glass" aria-label={t('flashcards.ariaLabel')}>
      <div className="panel-heading">
        <span>{t('flashcards.title')}</span>
        <Button variant="ghost" className="icon-button" onClick={onClose} aria-label={t('actions.close')}>
          <X size={18} />
        </Button>
      </div>
      {!card ? (
        <p className="panel-empty">{t('flashcards.empty')}</p>
      ) : (
        <>
          <div className="card-face">
            <span className="small-number">
              {n(index + 1)} / {n(cards.length)}
            </span>
            <button type="button" className="card-question" onClick={() => setShown((value) => !value)}>
              {locale === 'ar' ? (card.ar ?? card.en) : card.en}
            </button>
            <p className={`card-answer ${shown ? '' : 'is-hidden'}`}>{shown ? (locale === 'ar' ? card.en : (card.ar ?? card.en)) : '•••'}</p>
          </div>
          <div className="card-controls">
            <Button variant="ghost" onClick={() => setIndex((i) => (i - 1 + cards.length) % cards.length)} aria-label={t('flashcards.previous')}>
              <ChevronRight size={16} className="flip-inline" />
            </Button>
            <Button variant="ghost" className="primary-action" onClick={() => setShown((value) => !value)}>
              {shown ? t('flashcards.hide') : t('flashcards.show')}
            </Button>
            <Button variant="ghost" onClick={() => setIndex((i) => (i + 1) % cards.length)} aria-label={t('flashcards.next')}>
              <ChevronLeft size={16} className="flip-inline" />
            </Button>
          </div>
          <div className="card-links">
            <Button variant="ghost" onClick={() => onOpen(card)}>
              {t('detail.isolate')}
            </Button>
            <Button variant="ghost" onClick={() => onRemove(card.id)}>
              <Trash2 size={14} /> {t('flashcards.remove')}
            </Button>
          </div>
        </>
      )}
      <div className="panel-foot">
        <span>{t('flashcards.count', {count: cards.length})}</span>
        <span className="card-exports">
          <Button variant="ghost" disabled={!cards.length} onClick={() => download('anatomy-cards.csv', exportCards(cards, columns, ','), 'text/csv;charset=utf-8')}>
            <Download size={14} /> {t('flashcards.export')}
          </Button>
          <Button variant="ghost" disabled={!cards.length} onClick={() => download('anatomy-cards-anki.txt', exportCards(cards, columns, '\t'), 'text/plain;charset=utf-8')}>
            {t('flashcards.exportAnki')}
          </Button>
          <Button variant="ghost" disabled={!cards.length} onClick={onClear}>
            {t('flashcards.clear')}
          </Button>
        </span>
      </div>
    </section>
  );
}
