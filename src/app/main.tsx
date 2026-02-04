import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@react-sigma/core/lib/style.css';
import '@/styles/tailwind.css';
import App from '@/app/App';

const resolveMode = () => process.env.NODE_ENV ?? 'production';

export async function enableMocking(isDev: boolean) {
  if (isDev) {
    const { worker } = await import('@/mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }

  return Promise.resolve();
}

export async function bootstrap({
  rootId = 'root',
  isDev = resolveMode() === 'development',
}: {
  rootId?: string;
  isDev?: boolean;
} = {}) {
  const container = document.getElementById(rootId);

  if (!container) {
    throw new Error('Root container is missing in index.html');
  }

  await enableMocking(isDev);

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

if (resolveMode() !== 'test') {
  void bootstrap();
}
