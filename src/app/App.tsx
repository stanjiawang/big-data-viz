import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';
import { LoginPage } from '@/auth/LoginPage';
import { AppProviders } from '@/app/providers/AppProviders';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { DashboardPage } from '@/features/dashboard';
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
      <BrowserRouter>
        <AuthProvider enabled={runtimeConfig.enableAuth}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <RequireAuth
                  enabled={runtimeConfig.enableAuth}
                  requiredRoles={runtimeConfig.authRequiredRoles}
                  requireTenant={runtimeConfig.authRequireTenant}
                >
                  <DashboardPage />
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
