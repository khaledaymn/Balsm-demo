import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root',
})
export class HttpUtilsService {
  constructor(private readonly authService: AuthService) {}

  /**
   * Generates HTTP headers with authentication token.
   * @returns An HttpHeaders object with configured headers.
   */
  getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Accept: 'text/plain',
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    });
  }
}
