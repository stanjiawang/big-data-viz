import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_AUTH_ACCOUNTS } from '@/auth/authClient';
import { useAuth } from '@/auth/useAuth';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  UI_BUTTON_GHOST_SM,
  UI_BUTTON_PRIMARY_SM,
  UI_CHIP_INTERACTIVE,
  UI_INPUT_MD,
  UI_LABEL_CLASS,
  UI_TEXT_BODY_SM,
  UI_TEXT_SUBTITLE,
  UI_TEXT_TITLE_MD,
  UI_TEXT_TITLE_XL,
} from '@/components/ui/styleTokens';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import type { MessageKey } from '@/i18n/messages';
import { useI18n } from '@/i18n/useI18n';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

type FederatedProvider = {
  id: string;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
};

const FEDERATED_PROVIDERS: readonly FederatedProvider[] = [
  {
    id: 'okta',
    labelKey: 'authProviderOkta',
    descriptionKey: 'authProviderOktaDescription',
  },
  {
    id: 'azure-ad',
    labelKey: 'authProviderAzureAd',
    descriptionKey: 'authProviderAzureAdDescription',
  },
  {
    id: 'onelogin',
    labelKey: 'authProviderOneLogin',
    descriptionKey: 'authProviderOneLoginDescription',
  },
];

const SUPPORT_EMAIL = 'support@example.com';

export function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const runtimeConfig = getRuntimeConfig();
  const { signIn, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState(MOCK_AUTH_ACCOUNTS[0]?.email ?? '');
  const [password, setPassword] = useState(MOCK_AUTH_ACCOUNTS[0]?.password ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo =
    ((location.state as LocationState | undefined)?.from?.pathname?.trim() ?? '') || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  async function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProviderClick(_providerId: string) {
    setIsSubmitting(true);
    try {
      await signIn();
    } finally {
      setIsSubmitting(false);
    }
  }

  const forgotPasswordHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    'Password reset assistance',
  )}`;

  return (
    <main id="app-main" className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className={UI_LABEL_CLASS}>{t('dashboardTitle')}</p>
            <h1 className={`${UI_TEXT_TITLE_XL} text-slate-900`}>{t('authLoginTitle')}</h1>
            <p className={`${UI_TEXT_SUBTITLE} max-w-2xl text-slate-600`}>
              {t('authLoginSubtitle')}
            </p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>- {t('authLoginBulletSso')}</li>
              <li>- {t('authLoginBulletMock')}</li>
              <li>- {t('authLoginBulletRbac')}</li>
            </ul>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm lg:w-auto lg:self-start">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-8 shadow-[0_20px_60px_rgb(15_23_42/6%)]">
            <p className={UI_LABEL_CLASS}>{t('authProvidersTitle')}</p>
            <h2 className={`${UI_TEXT_TITLE_MD} mt-3`}>{t('authProvidersSubtitle')}</h2>
            <p className={`${UI_TEXT_BODY_SM} mt-3 text-slate-600`}>
              {t('authProvidersDescription')}
            </p>
            <div className="mt-6 space-y-3">
              {FEDERATED_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className={`${UI_BUTTON_GHOST_SM} w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-slate-700 hover:-translate-y-0.5 hover:border-blue-200`}
                  onClick={() => void handleProviderClick(provider.id)}
                  disabled={isSubmitting}
                >
                  <div className="flex flex-1 items-center gap-4">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 shadow-inner shadow-blue-100">
                      {t(provider.labelKey)[0] ?? ''}
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold tracking-wide text-slate-900">
                        {t(provider.labelKey)}
                      </p>
                      <p className="text-[12px] uppercase tracking-[0.18em] text-slate-500">
                        {t(provider.descriptionKey)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`${UI_CHIP_INTERACTIVE} h-8 min-w-16 border-blue-200/80 px-4 text-[11px] tracking-[0.2em] text-blue-700`}
                    >
                      {t('authProvidersBadge')}
                    </span>
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-slate-400"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M4 2l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-700">{t('authNeedHelp')}</p>
              <p className="mt-1">
                {t('authContactSupport')}{' '}
                <a
                  className="font-semibold text-blue-600 hover:underline"
                  href={`mailto:${SUPPORT_EMAIL}`}
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_25px_80px_rgb(15_23_42/10%)]">
            <p className={UI_LABEL_CLASS}>{t('authCredentialsTitle')}</p>
            <h2 className={`${UI_TEXT_TITLE_MD} mt-3`}>{t('authCredentialsSubtitle')}</h2>
            <p className={`${UI_TEXT_BODY_SM} mt-2 text-slate-600`}>{t('authCredentialHelper')}</p>
            {runtimeConfig.authProvider === 'mock' ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                {t('authMockAccount')}{' '}
                <span className="font-semibold">{MOCK_AUTH_ACCOUNTS[0]?.email}</span>
                <span className="ml-2 font-semibold">{MOCK_AUTH_ACCOUNTS[0]?.password}</span>
              </div>
            ) : null}
            <form className="mt-6 space-y-4" onSubmit={handleCredentialsSubmit}>
              <label className="block space-y-2">
                <span className={UI_LABEL_CLASS}>{t('authEmail')}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={UI_INPUT_MD}
                  autoComplete="username"
                />
              </label>
              <label className="block space-y-2">
                <span className={UI_LABEL_CLASS}>{t('authPassword')}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={UI_INPUT_MD}
                  autoComplete="current-password"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <a
                  className="font-semibold text-blue-600 hover:underline"
                  href={forgotPasswordHref}
                >
                  {t('authForgotPassword')}
                </a>
                <span className="text-slate-500">
                  {t('authLoginSecureHint')} {t('authProvidersBadge')}
                </span>
              </div>
              <button
                type="submit"
                className={`${UI_BUTTON_PRIMARY_SM} w-full justify-center`}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('authSigningIn') : t('authSignIn')}
              </button>
            </form>
            {error ? (
              <p role="status" className={`${UI_TEXT_BODY_SM} mt-4 text-rose-600`}>
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className={UI_CHIP_INTERACTIVE}>{t('authProvidersBadge')}</span>
              <span className={UI_CHIP_INTERACTIVE}>{t('authCredentialsBadge')}</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
