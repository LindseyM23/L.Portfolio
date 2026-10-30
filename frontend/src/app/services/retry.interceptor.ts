import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, timer } from 'rxjs';

// Statuses a sleeping/booting free-tier host returns while it wakes up
const TRANSIENT = new Set([0, 502, 503, 504]);

/**
 * Retries failed GET requests a few times with growing delays, so content
 * still loads when the API host is waking from sleep. Writes are never
 * retried (they might have gone through).
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  return next(req).pipe(
    retry({
      count: 4,
      delay: (error, attempt) => {
        if (!(error instanceof HttpErrorResponse) || !TRANSIENT.has(error.status)) throw error;
        return timer(attempt * 2000); // 2s, 4s, 6s, 8s
      }
    })
  );
};
