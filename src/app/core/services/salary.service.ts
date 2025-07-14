import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  EmployeeSalary,
  EmployeeSalaryDetails,
} from '../../models/employee-salary.model';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class SalaryService {
  private baseUrl = environment.apiUrl + '/Users'; // Adjust the URL as needed

  constructor(private http: HttpClient) {}

  getAllEmployeesSalaries(  month: number,
    year: number): Observable<EmployeeSalary[]> {
    const headers = new HttpHeaders({ accept: '*/*' });
 let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());
    return this.http
      .get<EmployeeSalary[]>(`${this.baseUrl}/GetAllEmployeesSalaries`, 
        { headers, params }
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching employee salaries:', error);
          return throwError(() => new Error('فشل في تحميل رواتب الموظفين.'));
        })
      );
  }

  getEmployeeSalaryDetails(
    employeeId: string,
    month: number,
    year: number
  ): Observable<EmployeeSalaryDetails> {
    let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    const headers = new HttpHeaders({ accept: '*/*' });

    return this.http
      .get<EmployeeSalaryDetails>(
        `${this.baseUrl}/EmployeeSalaryDetails/${employeeId}`,
        { headers, params }
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching employee salary details:', error);
          return throwError(
            () => new Error('فشل في تحميل تفاصيل راتب الموظف.')
          );
        })
      );
  }
}
