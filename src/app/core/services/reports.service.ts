import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AttendanceReportResponse } from '../../models/attendance-report.model';
import { EmployeeAttendanceLeaveResponse } from '../../models/employee-attendance-leave.model';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private baseUrl = 'https://hrwebsite.runasp.net/Reports';

  constructor(private http: HttpClient) {}

  getAttendanceReport(
    pageNumber: number,
    pageSize: number,
    year: number,
    month: number
  ): Observable<AttendanceReportResponse> {
    let params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString())
      .set('Year', year.toString())
      .set('Month', month.toString());

    const headers = new HttpHeaders({ accept: '*/*' });

    return this.http
      .get<AttendanceReportResponse>(`${this.baseUrl}/AttendanceReport`, {
        headers,
        params,
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching attendance report:', error);
          return throwError(
            () => new Error('Failed to fetch attendance report.')
          );
        })
      );
  }

  getEmployeeAttendanceAndLeaveReport(
    employeeId: string,
    reportType: number,
    options: {
      pageNumber?: number;
      pageSize?: number;
      dayDate?: string;
      fromDate?: string;
      toDate?: string;
      month?: number;
    } = {}
  ): Observable<EmployeeAttendanceLeaveResponse> {
    let params = new HttpParams()
      .set('EmployeeId', employeeId)
      .set('ReportType', reportType.toString());

    if (options.pageNumber)
      params = params.set('PageNumber', options.pageNumber.toString());
    if (options.pageSize)
      params = params.set('PageSize', options.pageSize.toString());
    if (options.dayDate) params = params.set('DayDate', options.dayDate);
    if (options.fromDate) params = params.set('FromDate', options.fromDate);
    if (options.toDate) params = params.set('ToDate', options.toDate);
    if (options.month) params = params.set('Month', options.month.toString());

    const headers = new HttpHeaders({ accept: '*/*' });

    return this.http
      .get<EmployeeAttendanceLeaveResponse>(
        `${this.baseUrl}/GetEmployeeAttendanceAndLeaveReport`,
        { headers, params }
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching employee attendance report:', error);
          return throwError(
            () => new Error('Failed to fetch employee attendance report.')
          );
        })
      );
  }
}
