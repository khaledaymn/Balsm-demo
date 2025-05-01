import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GeneralSettings } from '../../models/general-settings.model';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class GeneralSettingsService {
  private apiUrl = environment.apiUrl + '/GeneralSettings'; // Adjust the URL as needed

  constructor(private http: HttpClient) {}

  getGeneralSettings(): Observable<GeneralSettings> {
    // Assuming the Bearer token is added via an HTTP interceptor
    const headers = new HttpHeaders({
      accept: '*/*',
    });

    return this.http
      .get<GeneralSettings>(this.apiUrl + '/GetGeneralSetting', { headers })
      .pipe(
        map((response) => ({
          numberOfVacationsInYear: response.numberOfVacationsInYear,
          rateOfExtraAndLateHour: response.rateOfExtraAndLateHour,
          numberOfDayWorkingHours: response.numberOfDayWorkingHours,
        })),
        catchError((error) => {
          console.error('Error fetching general settings:', error);
          return throwError(
            () =>
              new Error(
                'Failed to fetch general settings. Please try again later.'
              )
          );
        })
      );
  }
}
