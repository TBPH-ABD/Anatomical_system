import {Award, Check, Eye, SkipForward, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useI18n} from '@/lib/i18n';

export type QuizPool = 'visible' | 'favorites' | 'all';
export type QuizStatus = 'asking' | 'right' | 'wrong' | 'revealed' | 'empty';

export interface QuizView {
  pool: QuizPool;
  status: QuizStatus;
  question: string;
  answer: string;
  wrongName: string;
  asked: number;
  correct: number;
  streak: number;
}

interface Props {
  quiz: QuizView;
  onPool: (pool: QuizPool) => void;
  onReveal: () => void;
  onSkip: () => void;
  onNext: () => void;
  onExit: () => void;
}

const POOLS: {id: QuizPool; key: 'quiz.scopeVisible' | 'quiz.scopeFavorites' | 'quiz.scopeAll'}[] = [
  {id: 'visible', key: 'quiz.scopeVisible'},
  {id: 'favorites', key: 'quiz.scopeFavorites'},
  {id: 'all', key: 'quiz.scopeAll'},
];

/** The question never shows the structure's name — that is the whole exercise.
 * It shows the system and piece count so the student still has a foothold. */
export function QuizPanel({quiz, onPool, onReveal, onSkip, onNext, onExit}: Props) {
  const {t, n} = useI18n();
  const resolved = quiz.status === 'right' || quiz.status === 'revealed';
  return (
    <section className="quiz-panel glass" aria-label={t('quiz.ariaLabel')} aria-live="polite">
      <div className="panel-heading">
        <span>{t('quiz.title')}</span>
        <Button variant="ghost" className="icon-button" onClick={onExit} aria-label={t('quiz.exit')}>
          <X size={18} />
        </Button>
      </div>
      <div className="quiz-scope" role="group" aria-label={t('quiz.scopeLabel')}>
        {POOLS.map((pool) => (
          <Button key={pool.id} variant="ghost" aria-pressed={quiz.pool === pool.id} onClick={() => onPool(pool.id)}>
            {t(pool.key)}
          </Button>
        ))}
      </div>
      {quiz.status === 'empty' ? (
        <p className="quiz-empty">{t('quiz.empty')}</p>
      ) : (
        <>
          <p className="quiz-prompt">{t('quiz.prompt')}</p>
          <p className="quiz-question">{quiz.question}</p>
          <p className={`quiz-feedback quiz-${quiz.status}`}>
            {quiz.status === 'asking' && t('quiz.tapPrompt')}
            {quiz.status === 'right' && (
              <>
                <Check size={15} /> {t('quiz.correct')} — {quiz.answer}
              </>
            )}
            {quiz.status === 'wrong' && t('quiz.wrong', {name: quiz.wrongName})}
            {quiz.status === 'revealed' && t('quiz.revealed', {name: quiz.answer})}
          </p>
          <div className="quiz-actions">
            {resolved ? (
              <Button className="primary-action" onClick={onNext}>
                {t('quiz.next')}
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={onReveal}>
                  <Eye size={15} /> {t('quiz.reveal')}
                </Button>
                <Button variant="ghost" onClick={onSkip}>
                  <SkipForward size={15} /> {t('quiz.skip')}
                </Button>
              </>
            )}
          </div>
        </>
      )}
      <div className="quiz-score">
        <span>{t('quiz.score', {correct: quiz.correct, asked: quiz.asked})}</span>
        <span className="quiz-streak">
          <Award size={14} /> {t('quiz.streak', {count: n(quiz.streak)})}
        </span>
      </div>
    </section>
  );
}
