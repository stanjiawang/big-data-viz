import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import {
  UI_BUTTON_GHOST_SM,
  UI_TEXT_SUBTITLE,
  UI_TEXT_TITLE_MD,
} from '@/components/ui/styleTokens';
import { useI18n } from '@/i18n/useI18n';

const PANEL_CLASS =
  'mx-auto flex min-h-[50vh] w-full max-w-[1480px] items-center justify-center px-4 py-10 sm:px-6 lg:px-8';

export function RequireAuth({
  enabled,
  requiredRoles = [],
  requireTenant = false,
  children,
}: {
  enabled: boolean;
  requiredRoles?: string[];
  requireTenant?: boolean;
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, hasAnyRole, hasTenantContext, signOut, session } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (!enabled) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <main id="app-main" className={PANEL_CLASS}>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          {t('authLoading')}
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireTenant && !hasTenantContext()) {
    return (
      <main id="app-main" className={PANEL_CLASS}>
        <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className={UI_TEXT_TITLE_MD}>{t('authTenantRequired')}</h1>
          <p className={UI_TEXT_SUBTITLE}>
            {t('authSignedInAs')}{' '}
            <span className="font-medium">{session?.user.name ?? t('authUnknownUser')}</span>,{' '}
            {t('authMissingTenant')}
          </p>
          <button type="button" className={UI_BUTTON_GHOST_SM} onClick={() => void signOut()}>
            {t('authSignOut')}
          </button>
        </div>
      </main>
    );
  }

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <main id="app-main" className={PANEL_CLASS}>
        <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className={UI_TEXT_TITLE_MD}>{t('authInsufficientPermissions')}</h1>
          <p className={UI_TEXT_SUBTITLE}>
            {t('authSignedInAs')}{' '}
            <span className="font-medium">{session?.user.name ?? t('authUnknownUser')}</span>,{' '}
            {t('authMissingRoles')}
          </p>
          <button type="button" className={UI_BUTTON_GHOST_SM} onClick={() => void signOut()}>
            {t('authSignOut')}
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
