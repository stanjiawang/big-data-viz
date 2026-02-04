import { QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { queryClient } from '@/app/queryClient';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  );
}
