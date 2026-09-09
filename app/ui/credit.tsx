import {useI18n} from '@/lib/i18n';

/** The project credit. It appears exactly twice: on the opening screen and as a
 * quiet corner line, so it never competes with the model. */
export function Credit({variant}: {variant: 'splash' | 'corner'}) {
  const {t} = useI18n();
  return (
    <div className={`credit credit-${variant}`} dir="rtl">
      <p className="credit-title">{t('credit.title')}</p>
      <p className="credit-line">{t('credit.line1')}</p>
      <p className="credit-line">{t('credit.line2')}</p>
    </div>
  );
}
