import { HttpStatus } from '@nestjs/common';

export interface Response<T> {
  statusCode: HttpStatus;
  method: string;
  path: string;
  data: T;
}
