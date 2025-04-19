import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      console.error('HTTP Error:', error);
      // Handle specific errors (e.g., 401 redirect to login)
      if (error.status === 401) {
        window.location.href = '/auth/login';
      }
      return throwError(() => error);
    })
  );
};
