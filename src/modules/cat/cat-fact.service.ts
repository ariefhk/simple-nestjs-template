import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { CatFact } from './interfaces/cat-fact.interface';

const CAT_FACT_URL = 'https://catfact.ninja/fact';

@Injectable()
export class CatFactService {
  constructor(private readonly httpService: HttpService) {}

  async getRandomFact(): Promise<CatFact> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<CatFact>(CAT_FACT_URL),
      );

      return data;
    } catch {
      throw new ServiceUnavailableException(
        'Unable to fetch a cat fact right now',
      );
    }
  }
}
