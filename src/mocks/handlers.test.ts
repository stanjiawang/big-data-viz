jest.mock('msw', () => {
  const httpGet = jest.fn((path: string, resolver: unknown) => ({
    info: { method: 'GET', path },
    resolver,
  }));

  return {
    http: { get: httpGet },
    HttpResponse: {
      json: jest.fn((body: unknown, init?: unknown) => ({ body, init })),
    },
  };
});

import { handlers, parseFilters, parseNumber } from '@/mocks/handlers';

describe('msw handlers', () => {
  it('registers expected handlers', () => {
    const { http } = jest.requireMock('msw');

    expect(handlers).toHaveLength(3);
    expect(http.get).toHaveBeenCalledTimes(3);
    expect(handlers.map((handler) => handler.info.method)).toEqual(['GET', 'GET', 'GET']);
  });

  it('parses numbers with fallback', () => {
    expect(parseNumber('42', 5)).toBe(42);
    expect(parseNumber('not-a-number', 5)).toBe(5);
    expect(parseNumber(null, 7)).toBe(7);
  });

  it('parses filters from search params', () => {
    const params = new URLSearchParams({
      label: 'class-A',
      labels: 'class-A, class-B',
      source: 'user',
      search: 'batch-001',
      weightMin: '0.5',
      weightMax: '2.5',
    });

    expect(parseFilters(params)).toEqual({
      label: 'class-A',
      labels: ['class-A', 'class-B'],
      source: 'user',
      search: 'batch-001',
      weightMin: 0.5,
      weightMax: 2.5,
    });
  });
});
