import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@react-sigma/core/lib/style.css';
import '@/styles/tailwind.css';
import App from '@/app/App';
import { getRuntimeConfig } from '@/config/runtimeConfig';
import { initPerformanceTelemetry } from '@/lib/performanceTelemetry';
import { initGlobalErrorTracking } from '@/lib/telemetry';

function getAppBaseUrl() {
  return typeof __APP_BASE_URL__ !== 'undefined' && __APP_BASE_URL__ ? __APP_BASE_URL__ : '/';
}

export async function enableMocking(enabled: boolean) {
  if (enabled) {
    const { worker } = await import('@/mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: `${getAppBaseUrl()}mockServiceWorker.js`,
      },
    });
  }

  return Promise.resolve();
}

export async function bootstrap({ rootId = 'root' }: { rootId?: string } = {}) {
  const container = document.getElementById(rootId);

  if (!container) {
    throw new Error('Root container is missing in index.html');
  }

  const config = getRuntimeConfig();
  await enableMocking(config.enableMocking);

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
