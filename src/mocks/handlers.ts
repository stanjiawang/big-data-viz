import { http, HttpResponse } from 'msw';
import { generateChunk, generateGraph, generateTimeSeries } from '@/lib/mockData';
import type { MockFilters, TrainingRecord } from '@/lib/types';

type MockFailure = 'unauthorized' | 'forbidden' | 'rate-limit' | 'server-error' | 'malformed';

type MockControls = {
  failure?: MockFailure;
  delayMs: number;
  requireAuth: boolean;
  requireTenant: boolean;
};

function parseBoolean(value: string | null, fallback = false) {
  if (value === null || value === '') {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return fallback;
}

function normalizeFailure(value: string | null): MockFailure | undefined {
  if (!value) {
    return undefined;
  }

  if (
    value === 'unauthorized' ||
    value === 'forbidden' ||
    value === 'rate-limit' ||
    value === 'server-error' ||
    value === 'malformed'
  ) {
    return value;
  }

  return undefined;
}

export function parseMockControls(searchParams: URLSearchParams): MockControls {
  const failure = normalizeFailure(searchParams.get('mockFailure'));
  const delayMs = Math.min(Math.max(parseNumber(searchParams.get('mockDelayMs'), 0) ?? 0, 0), 5000);
  const requireAuth = parseBoolean(searchParams.get('mockRequireAuth'));
  const requireTenant = parseBoolean(searchParams.get('mockRequireTenant'));

  return {
    failure,
    delayMs,
    requireAuth,
    requireTenant,
  };
}

function createErrorResponse(status: number, code: string, message: string) {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
  };

  if (status === 429) {
    headers['Retry-After'] = '1';
  }

  return HttpResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers,
    },
  );
}

function sleep(ms: number) {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function parseNumber(value: string | null, fallback?: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseFilters(searchParams: URLSearchParams): MockFilters {
  const label = searchParams.get('label') ?? undefined;
  const labels = searchParams.get('labels')
    ? searchParams
        .get('labels')
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;
  const source =
    (searchParams.get('source') as TrainingRecord['source'] | 'all' | null) ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const weightMin = parseNumber(searchParams.get('weightMin'));
  const weightMax = parseNumber(searchParams.get('weightMax'));

  return {
    label,
    labels,
    source,
    search,
    weightMin,
    weightMax,
  };
}

export const handlers = [
  http.get('/api/mock-data', async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const controls = parseMockControls(searchParams);
    const authHeader = request.headers.get('authorization');
    const tenantHeader = request.headers.get('x-tenant-id');

    if (controls.requireAuth && !authHeader) {
      return createErrorResponse(401, 'UNAUTHORIZED', 'Authorization header is required.');
    }

    if (controls.requireTenant && !tenantHeader) {
      return createErrorResponse(400, 'TENANT_REQUIRED', 'X-Tenant-Id header is required.');
    }

    if (controls.failure === 'unauthorized') {
      return createErrorResponse(401, 'UNAUTHORIZED', 'Mock unauthorized response.');
    }

    if (controls.failure === 'forbidden') {
      return createErrorResponse(403, 'FORBIDDEN', 'Mock forbidden response.');
    }

    if (controls.failure === 'rate-limit') {
      return createErrorResponse(429, 'RATE_LIMITED', 'Mock rate limit response.');
    }

    if (controls.failure === 'server-error') {
      return createErrorResponse(500, 'SERVER_ERROR', 'Mock server error response.');
    }

    await sleep(controls.delayMs);

    if (controls.failure === 'malformed') {
      return HttpResponse.json(
        {
          total: 'invalid-total',
          records: [],
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    const total = parseNumber(searchParams.get('total'), 1_000_000) ?? 1_000_000;
    const offset = parseNumber(searchParams.get('offset'), 0) ?? 0;
    const limit = parseNumber(searchParams.get('limit'), 1000) ?? 1000;
    const vectorSize = parseNumber(searchParams.get('vectorSize'), 64) ?? 64;
    const filters = parseFilters(searchParams);

    const payload = generateChunk({
      total: Math.max(total, 0),
      offset: Math.max(offset, 0),
      limit: Math.min(Math.max(limit, 1), 10_000),
      vectorSize: Math.min(Math.max(vectorSize, 2), 2048),
      filters,
    });

    return HttpResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }),
  http.get('/api/timeseries', async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const controls = parseMockControls(searchParams);

    if (controls.failure === 'unauthorized') {
      return createErrorResponse(401, 'UNAUTHORIZED', 'Mock unauthorized response.');
    }

    if (controls.failure === 'forbidden') {
      return createErrorResponse(403, 'FORBIDDEN', 'Mock forbidden response.');
    }

    if (controls.failure === 'rate-limit') {
      return createErrorResponse(429, 'RATE_LIMITED', 'Mock rate limit response.');
    }

    if (controls.failure === 'server-error') {
      return createErrorResponse(500, 'SERVER_ERROR', 'Mock server error response.');
    }

    await sleep(controls.delayMs);

    if (controls.failure === 'malformed') {
      return HttpResponse.json(
        {
          points: 'invalid-points',
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    const metric = searchParams.get('metric') ?? 'ingestion';
    return HttpResponse.json(generateTimeSeries(metric), {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }),
  http.get('/api/graph', async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const controls = parseMockControls(searchParams);

    if (controls.failure === 'unauthorized') {
      return createErrorResponse(401, 'UNAUTHORIZED', 'Mock unauthorized response.');
    }

    if (controls.failure === 'forbidden') {
      return createErrorResponse(403, 'FORBIDDEN', 'Mock forbidden response.');
    }

    if (controls.failure === 'rate-limit') {
      return createErrorResponse(429, 'RATE_LIMITED', 'Mock rate limit response.');
    }

    if (controls.failure === 'server-error') {
      return createErrorResponse(500, 'SERVER_ERROR', 'Mock server error response.');
    }

    await sleep(controls.delayMs);

    if (controls.failure === 'malformed') {
      return HttpResponse.json(
        {
          nodes: {},
          edges: {},
        },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    return HttpResponse.json(generateGraph(), {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }),
];
