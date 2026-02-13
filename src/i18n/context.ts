import { createContext } from 'react';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/messages';

export type I18nContextValue = {
  locale: Locale;
  setLocale: (_next: Locale) => void;
};

export const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
});
