import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private roleKey = 'user_role';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  login(
    email: string,
    password: string
  ): Observable<{ token: string; role: string }> {
    return this.http
      .post<{ token: string; role: string }>(`${this.apiUrl}/Account/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          this.setToken(response.token);
          this.setRole(response.role);
          this.isLoggedInSubject.next(true);
        }),
        catchError((error) => throwError(() => new Error('Login failed')))
      );
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email }).pipe(
      tap((response) => console.log('Password reset request sent:', response)),
      catchError((error) =>
        throwError(() => new Error('Failed to request password reset'))
      )
    );
  }

  validateResetToken(token: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/validate-reset-token`, { token })
      .pipe(
        tap((response) => console.log('Token validated:', response)),
        catchError((error) =>
          throwError(() => new Error('Invalid or expired token'))
        )
      );
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/reset-password`, { token, password })
      .pipe(
        tap((response) => console.log('Password reset successful:', response)),
        catchError((error) =>
          throwError(() => new Error('Failed to reset password'))
        )
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    this.isLoggedInSubject.next(false);
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  isLoggedIn$(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private setRole(role: string): void {
    localStorage.setItem(this.roleKey, role);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }
}
