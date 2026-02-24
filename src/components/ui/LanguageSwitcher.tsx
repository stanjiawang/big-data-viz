import { ThemedSelect } from '@/components/ui/ThemedSelect';
import { useI18n } from '@/i18n/useI18n';

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps = {}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={`w-full sm:w-[12.5rem] ${className ?? ''}`}>
      <ThemedSelect
        ariaLabel={t('language')}
        value={locale}
        options={[
          { value: 'en', label: t('languageEnglish') },
          { value: 'zh-CN', label: t('languageChinese') },
        ]}
        className="w-full"
        triggerClassName="flex h-10 items-center justify-between text-xs font-semibold uppercase tracking-[0.1em]"
        listClassName="max-w-[24rem]"
        onChange={(nextValue) => setLocale(nextValue as typeof locale)}
        leadingIcon={
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0">
            <path
              d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 0c1.6 1.7 2.5 4.4 2.5 7.5s-.9 5.8-2.5 7.5m0-15C8.4 4.2 7.5 6.9 7.5 10s.9 5.8 2.5 7.5M3 10h14M4.2 6.5h11.6M4.2 13.5h11.6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.2"
            />
          </svg>
        }
      />
    </div>
  );
}
