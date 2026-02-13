import { useContext, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { I18nContext } from '@/i18n/context';
import { DEFAULT_LOCALE, messages, type MessageKey } from '@/i18n/messages';

type TranslateValues = Record<string, string | number | boolean | null | undefined>;

export function useI18n() {
  const { locale, setLocale } = useContext(I18nContext);
  const intl = useIntl();

  return useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey, values?: TranslateValues) =>
        intl.formatMessage(
          {
            id: key,
            defaultMessage: messages[DEFAULT_LOCALE][key],
          },
          values,
        ),
    }),
    [intl, locale, setLocale],
  );
}
