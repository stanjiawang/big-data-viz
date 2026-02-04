import { lazy } from 'react';
import type React from 'react';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AsyncBoundary } from '@/components/ui/AsyncBoundary';

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('AsyncBoundary', () => {
  it('renders suspense fallback and then content', async () => {
    let resolveLazy: (() => void) | null = null;
    const LazyComponent = lazy(
      () =>
        new Promise<{ default: () => React.ReactElement }>((resolve) => {
          resolveLazy = () => resolve({ default: () => <div>Loaded</div> });
        }),
    );

    renderWithClient(
      <AsyncBoundary fallback={<div>Loading</div>}>
        <LazyComponent />
      </AsyncBoundary>,
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();

    await act(async () => {
      resolveLazy?.();
    });

    expect(await screen.findByText('Loaded')).toBeInTheDocument();
  });

  it('renders error state when child throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Broken = () => {
      throw new Error('boom');
    };

    renderWithClient(
      <AsyncBoundary fallback={<div>Loading</div>} errorTitle="Failed" errorMessage="Try again">
        <Broken />
      </AsyncBoundary>,
    );

    expect(await screen.findByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
