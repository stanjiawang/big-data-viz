import { UI_INPUT_MD, UI_LABEL_CLASS } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="inline-flex min-w-48 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm shadow-slate-900/5">
      <span className={`${UI_LABEL_CLASS} w-16 text-center`}>{t('language')}</span>
      <select
        className={`${UI_INPUT_MD} h-9 w-full min-w-28 px-2 text-xs`}
        aria-label={t('language')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
      >
        <option value="en">{t('languageEnglish')}</option>
        <option value="zh-CN">{t('languageChinese')}</option>
      </select>
    </label>
  );
}
