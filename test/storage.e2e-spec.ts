import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { App } from 'supertest/types';

import { Response as ApiResponse } from '../src/common/interceptors/interfaces/response.interface';
import { StoredFile } from '../src/modules/storage/interfaces/storage-driver.interface';
import { createTestApp } from './utils/create-test-app';

describe('Storage (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('uploads a file, serves it back, then deletes it', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post('/v1/storage')
      .attach('file', Buffer.from('hello from e2e'), 'note.txt')
      .expect(201);

    const stored = (uploadRes.body as ApiResponse<StoredFile>).data;
    expect(stored).toMatchObject({
      size: 'hello from e2e'.length,
      mimetype: 'text/plain',
      originalName: 'note.txt',
    });
    expect(stored.key).toEqual(expect.stringMatching(/\.txt$/));

    await request(app.getHttpServer())
      .get(`/storage/${stored.key}`)
      .expect(200)
      .expect('hello from e2e');

    await request(app.getHttpServer())
      .delete(`/v1/storage/${stored.key}`)
      .expect(204);

    await request(app.getHttpServer())
      .delete(`/v1/storage/${stored.key}`)
      .expect(404);
  });

  it('rejects a path-traversal key with 400', async () => {
    await request(app.getHttpServer())
      .delete('/v1/storage/..%2F..%2Fpackage.json')
      .expect(400);
  });
});
