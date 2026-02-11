import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@react-sigma/core/lib/style.css';
import '@/styles/tailwind.css';
import App from '@/app/App';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { initPerformanceTelemetry } from '@/lib/performanceTelemetry';
import { initGlobalErrorTracking } from '@/lib/telemetry';

export async function enableMocking(enabled: boolean) {
  if (enabled) {
    const { worker } = await import('@/mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }

  return Promise.resolve();
}

export async function bootstrap({
  rootId = 'root',
  isDev = getRuntimeConfig().mode === 'development',
}: {
  rootId?: string;
  isDev?: boolean;
} = {}) {
  const container = document.getElementById(rootId);

  if (!container) {
    throw new Error('Root container is missing in index.html');
  }

  const config = getRuntimeConfig();
  await enableMocking(isDev && config.enableMocking);

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  if (config.enableTelemetry) {
    initPerformanceTelemetry();
    initGlobalErrorTracking();
  }
}

if (getRuntimeConfig().mode !== 'test') {
  void bootstrap();
}
