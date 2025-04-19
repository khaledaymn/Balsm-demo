import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
// import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAttendanceData(): Observable<{
    labels: string[];
    attendance: number[];
    late: number[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/attendance`, {
      withCredentials: true,
    });
  }
}
