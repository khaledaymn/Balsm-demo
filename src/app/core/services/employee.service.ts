import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import {
  catchError,
  firstValueFrom,
  map,
  Observable,
  of,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environments';
import {
  Employee,
  addEmployee,
  editEmployee,
} from '../../models/employee.model';
import { Holiday } from '../../models/holiday.model';
import { UpdateSalesPercentageRequest } from '../../models/employee-salary.model';

// Generic API response interface
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = environment.apiUrl;
  private cachedEmployees: Employee[] | null = null;

  constructor(private http: HttpClient) {}

  // Helper to get HTTP headers with Authorization token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // Adjust based on your token storage
    return new HttpHeaders({
      Accept: '*/*',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  // Get all employees
  getEmployees(): Observable<ApiResponse<Employee[]>> {
    return this.http
      .get<ApiResponse<Employee[]>>(`${this.apiUrl}/users/getall`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  loadEmployees(): Observable<Employee[]> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/users/getall`).pipe(
      map((response) => {
        if (!response || !Array.isArray(response.data)) {
          throw new Error(
            `Invalid API response: Expected ${'data'} to be an array.`
          );
        }
        return response.data.map((employee) => ({
          ...employee,
          id: employee.id || 0, // Ensure id is present
          name: employee.name || '',
          email: employee.email || '',
          phoneNumber: employee.phoneNumber || '',
          address: employee.address || '',
          nationalId: employee.nationalId || '',
          salary: employee.salary ?? 0,
          shift: employee.shift || [],
          branch: employee.branch || [],
          gender: employee.gender || '',
          hiringDate: employee.hiringDate || '',
          dateOfBirth: employee.dateOfBirth || '', // Fixed typo: dateOfBarth -> dateOfBirth
          roles: employee.roles || [],
        }));
      }),
      catchError((error) => {
        console.error('Error loading employees:', error);
        return throwError(
          () => new Error('Failed to load employees. Please try again later.')
        );
      })
    );
  }
  isNameUnique(name: string): Observable<boolean> {
    if (!this.cachedEmployees) {
      return this.loadEmployees().pipe(
        map(
          (employees) =>
            !employees.some(
              (emp) => emp.name.toLowerCase() === name.toLowerCase()
            )
        )
      );
    }
    return of(
      !this.cachedEmployees.some(
        (emp) => emp.name.toLowerCase() === name.toLowerCase()
      )
    );
  }

  // Check if email is unique (client-side)
  isEmailUnique(email: string): Observable<boolean> {
    if (!this.cachedEmployees) {
      return this.loadEmployees().pipe(
        map(
          (employees) =>
            !employees.some(
              (emp) => emp.email.toLowerCase() === email.toLowerCase()
            )
        )
      );
    }
    return of(
      !this.cachedEmployees.some(
        (emp) => emp.email.toLowerCase() === email.toLowerCase()
      )
    );
  }
  // Delete an employee
  deleteEmployee(id: string): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/users/delete/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // Add a new employee
  addEmployee(employee: addEmployee): Observable<ApiResponse<Employee>> {
    return this.http
      .post<ApiResponse<Employee>>(`${this.apiUrl}/users/create`, employee, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // Get employee by ID
  getEmployeeById(id: string): Observable<ApiResponse<Employee>> {
    return this.http
      .get<ApiResponse<Employee>>(`${this.apiUrl}/users/getbyid/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // Update an employee
  updateEmployee(employee: editEmployee): Observable<ApiResponse<void>> {
    return this.http
      .put<ApiResponse<void>>(`${this.apiUrl}/users/edit`, employee, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  addUserToRole(body: {
    userId: string;
    roleName: string[];
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/Users/AddUserToRole`,
      body
    );
  }

  // Get all official holidays
  async getOfficialHolidays(): Promise<Holiday[]> {
    try {
      const response = await firstValueFrom(
        this.http
          .get<ApiResponse<Holiday[]>>(
            `${this.apiUrl}/OfficialVacations/GetAll`,
            {
              headers: this.getHeaders(),
            }
          )
          .pipe(catchError(this.handleError))
      );
      return response.data; // Return only the data array
    } catch (error) {
      throw error; // Let the component handle the error
    }
  }

  // Add a new official holiday
  async addOfficialHoliday(holiday: {
    vacationName: string;
    vacationDay: string;
  }): Promise<any> {
    return firstValueFrom(
      this.http
        .post<ApiResponse<void>>(
          `${this.apiUrl}/OfficialVacations/create`,
          holiday,
          {
            headers: this.getHeaders(),
          }
        )
        .pipe(catchError(this.handleError))
    );
  }

  // Update an official holiday
  async updateOfficialHoliday(holiday: Holiday): Promise<any> {
    return firstValueFrom(
      this.http
        .put<ApiResponse<any>>(
          `${this.apiUrl}/OfficialVacations/edit`,
          holiday,
          { headers: this.getHeaders() }
        )
        .pipe(catchError(this.handleError))
    );
  }

  // Delete an official holiday
  async deleteOfficialHoliday(id: string): Promise<any> {
    return firstValueFrom(
      this.http
        .delete<ApiResponse<any>>(
          `${this.apiUrl}/OfficialVacations/delete/${id}`,
          {
            headers: this.getHeaders(),
          }
        )
        .pipe(catchError(this.handleError))
    );
  }

  updateSalesPercentage(
    request: UpdateSalesPercentageRequest
  ): Observable<any> {
    console.log('Update Sales Percentage Request:', request);
    return this.http
      .put(`${this.apiUrl}/users/UpdateSalesPercentage`, request, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Update Sales Percentage Error:', error);
          return throwError(() => error);
        })
      );
  }
  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Something went wrong; please try again later.';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
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
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    console.error('API Error:', {
      status: error.status,
      message: errorMessage,
      error: error.error,
    });
    return throwError(() => new Error(errorMessage));
  }
}
