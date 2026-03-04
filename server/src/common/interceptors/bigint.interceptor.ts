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
    return next.handle().pipe(map((data) => this.convertBigIntToString(data)));
  }

  private convertBigIntToString(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data === 'bigint') return data.toString();
    if (Array.isArray(data))
      return data.map((item) => this.convertBigIntToString(item));
    if (typeof data === 'object' && !(data instanceof Date)) {
      // Don't break date objects!
      const result: any = {};
      for (const key in data) {
        result[key] = this.convertBigIntToString(data[key]);
      }
      return result;
    }
    return data;
  }
}
