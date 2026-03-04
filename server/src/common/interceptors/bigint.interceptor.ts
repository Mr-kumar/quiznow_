import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Early exit for null/undefined - no processing needed
        if (data === null || data === undefined) {
          return data;
        }

        // Quick check: Only process if data might contain BigInt
        if (!this.mightContainBigInt(data)) {
          return data;
        }

        // Handle nested response structure (e.g., { data: [...], pagination: {...} })
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'pagination' in data
        ) {
          return {
            data: this.serializeBigInts(data.data),
            pagination: data.pagination,
          };
        }

        // Handle array responses
        if (Array.isArray(data)) {
          return this.serializeBigInts(data);
        }

        // Handle single object responses
        return this.serializeBigInts(data);
      }),
    );
  }

  /**
   * Ultra-fast check to avoid unnecessary processing
   * Only runs deep serialization if BigInt actually exists
   */
  private mightContainBigInt(data: any): boolean {
    // Since we're using CUID strings for all IDs, BigInt should only exist in:
    // - Attempt IDs (BigInt in schema)
    // - Count fields
    // - Score fields

    if (typeof data === 'bigint') {
      return true;
    }

    if (Array.isArray(data)) {
      // Only check first few items for performance
      return data.slice(0, 3).some((item) => this.mightContainBigInt(item));
    }

    if (data && typeof data === 'object') {
      // Quick check for BigInt field patterns
      const keys = Object.keys(data);
      const bigIntPatterns = [
        'id',
        'total',
        'count',
        'attempts',
        'score',
        'marks',
      ];

      // Fast path: check if any key suggests BigInt content
      const hasBigIntKey = keys.some((key) =>
        bigIntPatterns.some((pattern) => key.toLowerCase().includes(pattern)),
      );

      if (!hasBigIntKey) {
        return false; // Early exit - no BigInt-like keys
      }

      // Only check values if we have BigInt-like keys
      return keys.some((key) => this.mightContainBigInt(data[key]));
    }

    return false;
  }

  private serializeBigInts(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'bigint') {
      return obj.toString();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.serializeBigInts(item));
    }

    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = this.serializeBigInts(obj[key]);
        }
      }
      return result;
    }

    return obj;
  }
}
