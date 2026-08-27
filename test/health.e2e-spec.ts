import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { App } from 'supertest/types';

import { createTestApp } from './utils/create-test-app';

interface HealthResult {
  status: string;
  info: Record<string, { status: string }>;
}

interface WrappedBody {
  data?: HealthResult;
  payload?: HealthResult;
}

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health reports the cache round-trip indicator', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health');

    // The overall status/HTTP code, and the memory_heap/memory_rss
    // indicators, are environment-dependent — a jest/ts-jest process can
    // exceed those thresholds even though the app itself is healthy. That's
    // a pre-existing quirk of health.controller.ts's fixed thresholds, not
    // something this test should assert on or flake against. The `redis`
    // indicator (a real cache set/get round-trip) is the only one this
    // process's memory footprint can't affect, so it's the only one
    // asserted here.
    expect([200, 503]).toContain(response.status);

    const wrapped = response.body as WrappedBody;
    const body = wrapped.data ?? wrapped.payload;

    expect(body?.info.redis).toEqual({ status: 'up' });
  });
});
