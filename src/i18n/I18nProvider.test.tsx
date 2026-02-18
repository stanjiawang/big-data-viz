import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/i18n/I18nProvider';
import { useI18n } from '@/i18n/useI18n';

function LocaleProbe() {
  const { locale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span>{t('dashboardTitle')}</span>
    </div>
  );
}

describe('I18nProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('prefers locale from query parameter', () => {
    window.history.replaceState({}, '', '/?lang=zh-CN');

    render(
      <I18nProvider>
        <LocaleProbe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN');
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(window.localStorage.getItem('bdv_locale')).toBe('zh-CN');
  });

  it('uses localStorage locale when query is not set', () => {
    window.localStorage.setItem('bdv_locale', 'zh-CN');

    render(
      <I18nProvider>
        <LocaleProbe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN');
  });
});
