import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@pharmasyn/types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the response already has success/data structure, pass through
        if (this.isApiResponse(data)) {
          return data;
        }
        return {
          success: true,
          data,
        };
      }),
    );
  }

  private isApiResponse(value: T): value is T & ApiResponse<T> {
    return Boolean(
      value &&
      typeof value === 'object' &&
      'success' in value &&
      'data' in value,
    );
  }
}
