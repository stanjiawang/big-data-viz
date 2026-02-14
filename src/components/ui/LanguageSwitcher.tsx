import { UI_BUTTON_GHOST_SM } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label
      className={`${UI_BUTTON_GHOST_SM} h-9 w-36 justify-start gap-1.5 px-2 text-left normal-case`}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-slate-500">
        <path
          d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 0c1.6 1.7 2.5 4.4 2.5 7.5s-.9 5.8-2.5 7.5m0-15C8.4 4.2 7.5 6.9 7.5 10s.9 5.8 2.5 7.5M3 10h14M4.2 6.5h11.6M4.2 13.5h11.6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
      <span className="relative min-w-0 flex-1">
        <select
          className="h-7 w-full appearance-none rounded-md border-0 bg-transparent px-1 pr-6 text-sm font-semibold text-slate-700 shadow-none transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          aria-label={t('language')}
          value={locale}
          onChange={(event) => setLocale(event.target.value as typeof locale)}
        >
          <option value="en">{t('languageEnglish')}</option>
          <option value="zh-CN">{t('languageChinese')}</option>
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
        >
          <path
            d="M5.25 7.75 10 12.25l4.75-4.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      </span>
    </label>
  );
}
