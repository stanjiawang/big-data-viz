import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';
import { queryClient } from '@/app/queryClient';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

export default function App() {
  const runtimeConfig = getRuntimeConfig();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider enabled={runtimeConfig.enableAuth}>
        <RequireAuth
          enabled={runtimeConfig.enableAuth}
          requiredRoles={runtimeConfig.authRequiredRoles}
          requireTenant={runtimeConfig.authRequireTenant}
        >
          <DashboardPage />
        </RequireAuth>
      </AuthProvider>
    </QueryClientProvider>
  );
}
