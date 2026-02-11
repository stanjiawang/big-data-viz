import { lazy } from 'react';
import type React from 'react';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AsyncBoundary } from '@/components/ui/AsyncBoundary';
import { ApiError } from '@/lib/errors';

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('AsyncBoundary', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

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

  it('renders override copy when child throws', async () => {
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

  it('uses standardized query error copy and retry countdown for retryable errors', async () => {
    jest.useFakeTimers();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const Retryable = () => {
      throw new ApiError({
        message: 'upstream overloaded',
        code: 'HTTP_ERROR',
        status: 429,
        url: '/api/retryable',
      });
    };

    renderWithClient(
      <AsyncBoundary fallback={<div>Loading</div>}>
        <Retryable />
      </AsyncBoundary>,
    );

    expect(await screen.findByText('Rate limited')).toBeInTheDocument();
    expect(
      screen.getByText('Too many requests were sent. Please retry shortly.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Retrying in 1s')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('disables auto retry UX for non-retryable query errors by default', async () => {
    jest.useFakeTimers();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const Forbidden = () => {
      throw new ApiError({
        message: 'forbidden',
        code: 'HTTP_ERROR',
        status: 403,
        url: '/api/forbidden',
      });
    };

    renderWithClient(
      <AsyncBoundary fallback={<div>Loading</div>}>
        <Forbidden />
      </AsyncBoundary>,
    );

    expect(await screen.findByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText(/Retrying in/)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
