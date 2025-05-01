import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  /**
   * Handles HTTP errors and returns an appropriate error message.
   * @param error The HTTP error response.
   * @returns An Observable that throws an error with a formatted message.
   */
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Something went wrong; please try again later.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      const status = error.status ?? 'unknown';
      switch (status) {
        case 201:
          errorMessage =
            'Unexpected success response (201) with parsing failure. Check response format.';
          break;
        case 401:
          errorMessage = 'Unauthorized: Please log in again.';
          break;
        case 403:
          errorMessage =
            'Forbidden: You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error: Please try again later.';
          break;
        default:
          errorMessage = `Error ${status}: ${error.message || 'Unknown error'}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
