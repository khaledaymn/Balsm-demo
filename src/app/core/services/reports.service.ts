import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AttendanceReportResponse } from '../../models/attendance-report.model';
import { EmployeeAttendanceLeaveResponse } from '../../models/employee-attendance-leave.model';
import { EmployeeVacation } from '../../models/employee-vacation.model';
import { environment } from '../../../environments/environments';
import { AbsenceReportResponse } from '../../models/absence-report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private baseUrl = environment.apiUrl + '';

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
      .get<AttendanceReportResponse>(
        `${this.baseUrl}/Reports/AttendanceReport`,
        {
          headers,
          params,
        }
      )
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
      .set('ReportType', reportType.toString() || 1);

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
        `${this.baseUrl}/Reports/GetEmployeeAttendanceAndLeaveReport`,
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
  getEmployeeVacations(
    employeeId: string,
    pageNumber: number,
    pageSize: number,
    year: number,
    month: number
  ): Observable<EmployeeVacation> {
    let params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString())
      .set('Year', year.toString())
      .set('Month', month.toString());
    const headers = new HttpHeaders({ accept: '*/*' });

    return this.http.get<EmployeeVacation>(
      `${this.baseUrl}/Users/EmployeeVacations/${employeeId}`,
      { headers, params }
    );
  }
  getAbsenceReport(
    employeeId: string,
    reportType: number,
    params: {
      pageNumber: number;
      pageSize: number;
      dayDate?: string;
      fromDate?: string;
      toDate?: string;
      month?: number;
    }
  ): Observable<AbsenceReportResponse> {
    let httpParams = new HttpParams()
      .set('EmployeeId', employeeId)
      .set('ReportType', reportType.toString())
      .set('PageNumber', params.pageNumber.toString())
      .set('PageSize', params.pageSize.toString());
    if (params.dayDate) httpParams = httpParams.set('DayDate', params.dayDate);
    if (params.fromDate)
      httpParams = httpParams.set('FromDate', params.fromDate);
    if (params.toDate) httpParams = httpParams.set('ToDate', params.toDate);
    if (params.month)
      httpParams = httpParams.set('Month', params.month.toString());
    const headers = new HttpHeaders({ accept: '*/*' });

    return this.http.get<AbsenceReportResponse>(
      `${this.baseUrl}/Reports/AbsenceReport`,
      { headers, params: httpParams }
    );
  }
}
