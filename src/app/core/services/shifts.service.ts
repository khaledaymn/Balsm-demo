import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environments';
import { Employee } from '../../models/employee.model';
import { Shift } from '../../models/shifts.model';

@Injectable({
  providedIn: 'root',
})
export class ShiftsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // Adjust based on your auth setup
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  getEmployeesWithShifts(): Observable<{ success: boolean; data: Employee[] }> {
    return this.http
      .get<{ success: boolean; data: Employee[] }>(
        `${this.apiUrl}/users/getall`,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(catchError(this.handleError));
  }

  addShift(shift: Shift): Observable<{ success: boolean; data: Shift }> {
    return this.http
      .post<{ success: boolean; data: Shift }>(
        `${this.apiUrl}/shifts/create`,
        shift,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(catchError(this.handleError));
  }

  deleteShift(payload: {
    shiftId: number;
    employeeId: string;
  }): Observable<string> {
    return this.http
      .delete(`${this.apiUrl}/shifts/delete`, {
        headers: this.getAuthHeaders(),
        body: payload,
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Something went wrong; please try again later.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      errorMessage = `Server error: ${error.status} - ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage += ` - ${error.error.message}`;
      }
      if (error.status === 401) {
        errorMessage = 'Unauthorized: Admin access required.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid shift details provided.';
      }
    }
    console.error('An error occurred:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
