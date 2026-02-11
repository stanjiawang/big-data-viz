import { API_SCHEMA_VERSION } from '@/lib/contracts';
import { generateChunk, generateGraph, generateTimeSeries } from '@/lib/mockData';
import { dataChunkSchema, graphResponseSchema, timeSeriesResponseSchema } from '@/lib/schemas';

describe('api contracts', () => {
  it('validates mock data contract version and shape', () => {
    const payload = generateChunk({ total: 100, offset: 0, limit: 10, vectorSize: 8 });
    expect(payload.schemaVersion).toBe(API_SCHEMA_VERSION);
    expect(dataChunkSchema.safeParse(payload).success).toBe(true);
  });

  it('validates time series contract version and shape', () => {
    const payload = generateTimeSeries('ingestion');
    expect(payload.schemaVersion).toBe(API_SCHEMA_VERSION);
    expect(timeSeriesResponseSchema.safeParse(payload).success).toBe(true);
  });

  it('validates graph contract version and shape', () => {
    const payload = generateGraph();
    expect(payload.schemaVersion).toBe(API_SCHEMA_VERSION);
    expect(graphResponseSchema.safeParse(payload).success).toBe(true);
  });

  it('rejects schema version mismatches', () => {
    const payload = {
      schemaVersion: 'legacy-version',
      total: 1,
      offset: 0,
      limit: 1,
      records: [],
    };

    expect(dataChunkSchema.safeParse(payload).success).toBe(false);
  });
});
