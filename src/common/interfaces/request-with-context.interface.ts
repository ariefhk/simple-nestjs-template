import { Request } from 'express';

export interface RequestWithContext extends Request {
  timeStart?: number;
  userSession?: {
    email?: string;
    userId?: string;
  };
}
