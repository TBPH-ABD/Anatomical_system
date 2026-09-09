import {useEffect} from 'react';
import {AlertTriangle, Loader2, Sparkles, WifiOff, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useI18n} from '@/lib/i18n';
import type {MessageKey} from '@/lib/i18n';
import {parseExplanation} from '@/lib/explain';

export type ExplainPhase = 'idle' | 'offline' | 'loading' | 'ready' | 'error';

interface TriggerProps {
  onStart: () => void;
}

/** Sits in the detail panel where the source link used to be. */
export function ExplainButton({onStart}: TriggerProps) {
  const {t} = useI18n();
  return (
    <Button variant="ghost" className="explain-trigger" onClick={onStart}>
      <Sparkles size={15} />
      {t('explain.action')}
    </Button>
  );
}

interface WindowProps {
  phase: ExplainPhase;
  title: string;
  text: string;
  error: MessageKey;
  onRetry: () => void;
  onClose: () => void;
}

/** The explanation opens as a window over the page, in the page's own language
 * and direction. Offline is the one case that never opens it: it only warns. */
export function ExplainWindow({phase, title, text, error, onRetry, onClose}: WindowProps) {
  const {t, dir} = useI18n();
  useEffect(() => {
    if (phase === 'idle') return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    addEventListener('keydown', key, true);
    return () => removeEventListener('keydown', key, true);
  }, [phase, onClose]);

  if (phase === 'idle') return null;

  if (phase === 'offline') {
    return (
      <div className="explain-backdrop" onClick={onClose}>
        <div className="explain-alert glass" role="alertdialog" aria-label={t('explain.noticeTitle')} dir={dir} onClick={(event) => event.stopPropagation()}>
          <p className="explain-alert-title">
            <WifiOff size={17} /> {t('explain.noticeTitle')}
          </p>
          <p className="explain-alert-body">{t('explain.offlineBody')}</p>
          <Button className="primary-action" onClick={onClose}>
            {t('explain.ok')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="explain-backdrop" onClick={onClose}>
      <div className="explain-window glass" role="dialog" aria-modal="true" aria-label={t('explain.title')} dir={dir} onClick={(event) => event.stopPropagation()}>
        <header className="explain-window-head">
          <div>
            <span className="explain-badge">
              <Sparkles size={13} /> {t('explain.title')}
            </span>
            <h3>{title}</h3>
          </div>
          <Button variant="ghost" className="icon-button" onClick={onClose} aria-label={t('explain.close')}>
            <X size={17} />
          </Button>
        </header>
        <div className="explain-window-body">
          {phase === 'loading' && (
            <p className="explain-loading" role="status">
              <Loader2 size={16} className="explain-spinner" /> {t('explain.loading')}
            </p>
          )}
          {phase === 'error' && (
            <div className="explain-error" role="alert">
              <p className="explain-alert-title">
                <AlertTriangle size={15} /> {t(error)}
              </p>
              <Button className="primary-action" onClick={onRetry}>
                {t('explain.retry')}
              </Button>
            </div>
          )}
          {phase === 'ready' &&
            parseExplanation(text).map((section, index) => (
              <section key={`${section.heading}-${index}`} className="explain-section">
                {section.heading && <h4>{section.heading}</h4>}
                {section.lines.map((line, lineIndex) => (
                  <p key={lineIndex}>{line}</p>
                ))}
              </section>
            ))}
        </div>
        {phase === 'ready' && <footer className="explain-window-foot">{t('explain.disclaimer')}</footer>}
      </div>
    </div>
  );
}
