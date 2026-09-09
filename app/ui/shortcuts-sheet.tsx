import {Sheet, SheetContent, SheetTitle} from '@/components/ui/sheet';
import {useI18n} from '@/lib/i18n';
import type {MessageKey} from '@/lib/i18n';

/** Keys are printed in Latin because that is what the keyboard shows. */
const SHORTCUTS: [string, MessageKey][] = [
  ['/', 'shortcuts.search'],
  ['L', 'shortcuts.layers'],
  ['N', 'shortcuts.labels'],
  ['Q', 'shortcuts.quiz'],
  ['F', 'shortcuts.favorite'],
  ['I', 'shortcuts.isolate'],
  ['R', 'shortcuts.rotate'],
  ['0', 'shortcuts.reset'],
  ['1 – 4', 'shortcuts.views'],
  ['Esc', 'shortcuts.escape'],
  ['A', 'shortcuts.about'],
  ['?', 'shortcuts.help'],
];

export function ShortcutsSheet({open, onOpenChange}: {open: boolean; onOpenChange: (value: boolean) => void}) {
  const {t} = useI18n();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="about-sheet glass">
        <div className="eyebrow">{t('actions.shortcuts')}</div>
        <SheetTitle className="structure-title">{t('shortcuts.title')}</SheetTitle>
        <dl className="shortcut-list">
          {SHORTCUTS.map(([key, label]) => (
            <div key={key} className="shortcut-row">
              <dt>
                <kbd>{key}</kbd>
              </dt>
              <dd>{t(label)}</dd>
            </div>
          ))}
        </dl>
      </SheetContent>
    </Sheet>
  );
}
