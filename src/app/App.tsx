import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';
import { queryClient } from '@/app/queryClient';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { I18nProvider } from '@/i18n/I18nProvider';
import { useI18n } from '@/i18n/useI18n';

function AppContent() {
  const runtimeConfig = getRuntimeConfig();
  const { t } = useI18n();

  return (
    <>
      <a
        href="#app-main"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('appSkipToMain')}
      </a>
      <AuthProvider enabled={runtimeConfig.enableAuth}>
        <RequireAuth
          enabled={runtimeConfig.enableAuth}
          requiredRoles={runtimeConfig.authRequiredRoles}
          requireTenant={runtimeConfig.authRequireTenant}
        >
          <DashboardPage />
        </RequireAuth>
      </AuthProvider>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </QueryClientProvider>
  );
}
