import { HttpService } from '@nestjs/axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import { CatFactService } from '../cat-fact.service';

describe('CatFactService', () => {
  let service: CatFactService;
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatFactService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get(CatFactService);
  });

  it('returns the fact from a successful response', async () => {
    const fact = { fact: 'Cats sleep a lot.', length: 18 };
    httpService.get.mockReturnValue(
      of({ data: fact } as AxiosResponse<typeof fact>),
    );

    await expect(service.getRandomFact()).resolves.toEqual(fact);
  });

  it('throws ServiceUnavailableException when the request fails', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('boom')));

    await expect(service.getRandomFact()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
