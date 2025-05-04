import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Notification,
  TakeLeaveResponse,
} from '../../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private baseUrl = 'https://hrwebsite.runasp.net';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    const headers = new HttpHeaders({ accept: '*/*' });

    return this.http
      .get<Notification[]>(`${this.baseUrl}/Notifications/get`, { headers })
      .pipe(
        catchError((error) => {
          console.error('Error fetching notifications:', error);
          return throwError(() => new Error('فشل في تحميل الإشعارات.'));
        })
      );
  }

  takeLeaveByAdmin({
    employeeId,
    shiftId,
  }: { employeeId: string; shiftId: number }): Observable<TakeLeaveResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: '*/*',
    });

    const body = {
      employeeId,
      shiftId,
    };

    return this.http
      .post<TakeLeaveResponse>(
        `${this.baseUrl}/Attendance/TakeLeaveByAdmin`,
        body,
        { headers }
      )
      .pipe(
        catchError((error) => {
          console.error('Error taking leave by admin:', error);
          return throwError(() => new Error('فشل في تسجيل المغادرة.'));
        })
      );
  }

  deleteNotification(id: number): Observable<string> {
    const headers = new HttpHeaders({ accept: '*/*' });

    return this.http
      .delete(`${this.baseUrl}/Notifications/delete/${id}`, {
        headers,
        responseType: 'text',
      })
      .pipe(
        catchError((error) => {
          console.error('Error deleting notification:', error);
          return throwError(() => new Error('فشل في حذف الإشعار.'));
        })
      );
  }
}
