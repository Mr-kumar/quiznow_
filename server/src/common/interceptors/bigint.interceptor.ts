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
    return next.handle().pipe(map((data) => this.safeConvert(data)));
  }

  private safeConvert(data: any, seen = new WeakSet()): any {
    if (data === null || data === undefined) return data;

    // RECURSION GUARD: Stop infinite loops
    if (typeof data === 'object' && data !== null) {
      if (seen.has(data)) return '[Circular]';
      seen.add(data);
    }

    if (typeof data === 'bigint') return data.toString();
    if (Array.isArray(data))
      return data.map((item) => this.safeConvert(item, seen));

    if (typeof data === 'object' && !(data instanceof Date)) {
      const result: any = {};
      // 🛡️ FIXED: Use Object.keys to avoid prototype properties
      for (const key of Object.keys(data)) {
        result[key] = this.safeConvert(data[key], seen);
      }
      return result;
    }
    return data;
  }
}
