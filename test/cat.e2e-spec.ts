import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { App } from 'supertest/types';

import { Response as ApiResponse } from '../src/common/interceptors/interfaces/response.interface';
import { Cat } from '../src/modules/cat/entities/cat.entity';
import { createTestApp } from './utils/create-test-app';

describe('Cat (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('supports the full create -> read -> update -> delete lifecycle', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/v1/cats')
      .send({ name: 'Tom', age: 3, breed: 'Tabby' })
      .expect(201);

    const cat = (createRes.body as ApiResponse<Cat>).data;
    expect(cat).toMatchObject({ name: 'Tom', age: 3, breed: 'Tabby' });
    expect(cat.id).toEqual(expect.any(String));

    const listRes = await request(app.getHttpServer())
      .get('/v1/cats')
      .expect(200);
    expect((listRes.body as ApiResponse<Cat[]>).data).toContainEqual(cat);

    const getRes = await request(app.getHttpServer())
      .get(`/v1/cats/${cat.id}`)
      .expect(200);
    expect((getRes.body as ApiResponse<Cat>).data).toEqual(cat);

    const updateRes = await request(app.getHttpServer())
      .patch(`/v1/cats/${cat.id}`)
      .send({ age: 4 })
      .expect(200);
    expect((updateRes.body as ApiResponse<Cat>).data).toEqual({
      ...cat,
      age: 4,
    });

    await request(app.getHttpServer()).delete(`/v1/cats/${cat.id}`).expect(204);

    await request(app.getHttpServer()).get(`/v1/cats/${cat.id}`).expect(404);
  });

  it('rejects an invalid payload with 400', async () => {
    await request(app.getHttpServer())
      .post('/v1/cats')
      .send({ name: '', age: -1, breed: '' })
      .expect(400);
  });

  // /v1/cats/fact calls a real third-party API (catfact.ninja) — covered by
  // CatFactService's unit tests (success + failure, mocked HttpService)
  // instead of here, so e2e coverage stays deterministic and offline.
});
