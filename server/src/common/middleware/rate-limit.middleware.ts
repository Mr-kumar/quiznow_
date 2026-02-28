import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiting middleware for DRY request throttling
 * Prevents API abuse and brute force attacks
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requestMap: Map<
    string,
    {
      count: number;
      resetTime: number;
    }
  > = new Map();

  use(req: Request, res: Response, next: NextFunction) {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_REQUESTS = 100; // Requests per window

    let record = this.requestMap.get(key);

    if (!record || now > record.resetTime) {
      // New window
      this.requestMap.set(key, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
      return next();
    }

    record.count++;

    if (record.count > MAX_REQUESTS) {
      throw new HttpException(
        'Too many requests. Please try again after 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}

/**
 * Stricter rate limiting for authentication endpoints
 * Prevents brute force login/registration attacks
 */
@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
  private requestMap: Map<
    string,
    {
      count: number;
      resetTime: number;
    }
  > = new Map();

  use(req: Request, res: Response, next: NextFunction) {
    const key = `${req.ip}-auth`;
    const now = Date.now();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_REQUESTS = 10; // Much stricter for auth

    let record = this.requestMap.get(key);

    if (!record || now > record.resetTime) {
      this.requestMap.set(key, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
      return next();
    }

    record.count++;

    if (record.count > MAX_REQUESTS) {
      throw new HttpException(
        'Too many authentication attempts. Please try again after 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}

/**
 * Rate limiting for file uploads
 * Prevents spam uploads
 */
@Injectable()
export class UploadRateLimitMiddleware implements NestMiddleware {
  private requestMap: Map<
    string,
    {
      count: number;
      resetTime: number;
    }
  > = new Map();

  use(req: Request, res: Response, next: NextFunction) {
    const key = `${req.ip}-upload`;
    const now = Date.now();
    const WINDOW_MS = 60 * 60 * 1000; // 1 hour
    const MAX_UPLOADS = 5; // 5 uploads per hour

    let record = this.requestMap.get(key);

    if (!record || now > record.resetTime) {
      this.requestMap.set(key, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
      return next();
    }

    record.count++;

    if (record.count > MAX_UPLOADS) {
      throw new HttpException(
        'Upload limit exceeded. Maximum 5 uploads per hour.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
