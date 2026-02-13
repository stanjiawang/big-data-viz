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

import { handlers, parseFilters, parseMockControls, parseNumber } from '@/mocks/handlers';

function mockRequest(url: string, headers?: Record<string, string>) {
  return {
    url,
    headers: {
      get: (name: string) => headers?.[name.toLowerCase()] ?? null,
    },
  };
}

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

  it('parses mock controls from search params', () => {
    const params = new URLSearchParams({
      mockFailure: 'rate-limit',
      mockDelayMs: '150',
      mockRequireAuth: 'true',
      mockRequireTenant: 'true',
    });

    expect(parseMockControls(params)).toEqual({
      failure: 'rate-limit',
      delayMs: 150,
      requireAuth: true,
      requireTenant: true,
    });
  });

  it('normalizes invalid mock controls', () => {
    const params = new URLSearchParams({
      mockFailure: 'unknown-mode',
      mockDelayMs: '999999',
      mockRequireAuth: 'invalid',
    });

    expect(parseMockControls(params)).toEqual({
      failure: undefined,
      delayMs: 5000,
      requireAuth: false,
      requireTenant: false,
    });
  });

  it('returns auth/tenant errors for mock-data endpoint', async () => {
    const mockDataHandler = handlers[0];

    const authResult = await mockDataHandler.resolver({
      request: mockRequest('http://localhost/api/mock-data?mockRequireAuth=true'),
    });
    expect(authResult.init.status).toBe(401);
    expect(authResult.body.error.code).toBe('UNAUTHORIZED');

    const tenantResult = await mockDataHandler.resolver({
      request: mockRequest('http://localhost/api/mock-data?mockRequireTenant=true', {
        authorization: 'Bearer token',
      }),
    });
    expect(tenantResult.init.status).toBe(400);
    expect(tenantResult.body.error.code).toBe('TENANT_REQUIRED');
  });

  it('returns failure and malformed payload modes for mock-data endpoint', async () => {
    const mockDataHandler = handlers[0];

    const rateLimited = await mockDataHandler.resolver({
      request: mockRequest('http://localhost/api/mock-data?mockFailure=rate-limit'),
    });
    expect(rateLimited.init.status).toBe(429);
    expect(rateLimited.init.headers['Retry-After']).toBe('1');

    const malformed = await mockDataHandler.resolver({
      request: mockRequest('http://localhost/api/mock-data?mockFailure=malformed'),
    });
    expect(malformed.body.total).toBe('invalid-total');
  });

  it('returns generated data for mock-data endpoint', async () => {
    const mockDataHandler = handlers[0];
    const success = await mockDataHandler.resolver({
      request: mockRequest(
        'http://localhost/api/mock-data?total=100&offset=5&limit=20&vectorSize=8&labels=class-A,class-B',
        {
          authorization: 'Bearer token',
          'x-tenant-id': 'tenant-a',
        },
      ),
    });

    expect(success.init.status ?? 200).toBe(200);
    expect(success.body.total).toBeGreaterThan(0);
    expect(Array.isArray(success.body.records)).toBe(true);
  });

  it('covers failure branches for timeseries and graph endpoints', async () => {
    const timeseriesHandler = handlers[1];
    const graphHandler = handlers[2];

    const forbidden = await timeseriesHandler.resolver({
      request: mockRequest('http://localhost/api/timeseries?mockFailure=forbidden'),
    });
    expect(forbidden.init.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');

    const malformedSeries = await timeseriesHandler.resolver({
      request: mockRequest('http://localhost/api/timeseries?mockFailure=malformed'),
    });
    expect(malformedSeries.body.points).toBe('invalid-points');

    const serverError = await graphHandler.resolver({
      request: mockRequest('http://localhost/api/graph?mockFailure=server-error'),
    });
    expect(serverError.init.status).toBe(500);
    expect(serverError.body.error.code).toBe('SERVER_ERROR');

    const malformedGraph = await graphHandler.resolver({
      request: mockRequest('http://localhost/api/graph?mockFailure=malformed'),
    });
    expect(malformedGraph.body.nodes).toEqual({});
    expect(malformedGraph.body.edges).toEqual({});
  });
});
