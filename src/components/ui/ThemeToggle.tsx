import { useEffect, useState } from 'react';
import { UI_BUTTON_GHOST_SM } from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'bdv_theme';

function resolveInitialTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps = {}) {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className={`${UI_BUTTON_GHOST_SM} w-full min-w-0 sm:min-w-36 ${className ?? ''}`}
      aria-label={t('themeSwitchAria')}
      onClick={() => setTheme(nextTheme)}
    >
      {t('theme')}: {theme === 'light' ? t('themeLight') : t('themeDark')}
    </button>
  );
}
