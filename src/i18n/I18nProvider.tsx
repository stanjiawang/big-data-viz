import { useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { I18nContext, type I18nContextValue } from '@/i18n/context';
import { DEFAULT_LOCALE, messages, SUPPORTED_LOCALES, type Locale } from '@/i18n/messages';

const LOCALE_STORAGE_KEY = 'bdv_locale';

function isSupportedLocale(value: string | null): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));
}

function resolveInitialLocale(): Locale {
  const searchLocale = new URLSearchParams(window.location.search).get('lang');
  if (isSupportedLocale(searchLocale)) {
    return searchLocale;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isSupportedLocale(storedLocale)) {
    return storedLocale;
  }

  const browserLocale = navigator.language;
  if (isSupportedLocale(browserLocale)) {
    return browserLocale;
  }
  if (browserLocale.startsWith('zh')) {
    return 'zh-CN';
  }

  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => resolveInitialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const contextValue = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
    };
  }, [locale]);

  return (
    <I18nContext.Provider value={contextValue}>
      <IntlProvider locale={locale} messages={messages[locale]} defaultLocale={DEFAULT_LOCALE}>
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  );
}
