import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token'; // Key for localStorage
  private rolesKey = 'auth_roles'; // Key for localStorage
  private userIdKey = 'auth_userId'; // Key for userId in localStorage
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  login(
    email: string,
    password: string
  ): Observable<{
    token: string;
    roles: string[] | string | null;
    id: string;
  }> {
    return this.http
      .post<{
        token: string;
        roles: string[] | string | null;
        id: string;
      }>(`${this.apiUrl}/Account/login`, { email, password })
      .pipe(
        tap((response) => {
          this.setToken(response.token);
          this.setRoles(response.roles ?? 'User'); // Default to 'User' if roles are null
          this.setUserId(response.id);
          this.isLoggedInSubject.next(true);
        }),
        catchError((error) =>
          throwError(() => new Error('Login failed: ' + error.message))
        )
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/Account/logout`, {}).pipe(
      tap(() => this.clearAuthData()),
      catchError((error) => {
        console.error('Logout error:', error);
        this.clearAuthData();
        return of(null);
      })
    );
  }

  getUserInfo(): Observable<{
    token: string | null;
    roles: string[] | string | null;
    userId: string | null;
  }> {
    return this.http
      .get<{
        token: string | null;
        roles: string[] | string | null;
        userId: string | null;
      }>(`${this.apiUrl}/me`)
      .pipe(catchError(() => of({ token: null, roles: null, userId: null })));
  }

  public checkAuthStatus(): Observable<any> {
    if (!this.hasToken()) {
      this.isLoggedInSubject.next(false);
      return of(null);
    }
    return this.getUserInfo().pipe(
      tap((response) => {
        if (response.token && response.roles && response.userId) {
          this.setToken(response.token);
          this.setRoles(response.roles);
          this.setUserId(response.userId);
          this.isLoggedInSubject.next(true);
        } else {
          this.clearAuthData();
        }
      }),
      catchError(() => {
        this.clearAuthData();
        return of(null);
      })
    );
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRoles(): string[] {
    const roles = localStorage.getItem(this.rolesKey);
    return roles ? JSON.parse(roles) : [];
  }

  getUserId(): string | null {
    return localStorage.getItem(this.userIdKey);
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  hasAnyRole(allowedRoles: string[]): boolean {
    return allowedRoles.some((role) => this.getRoles().includes(role));
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  isEmployee(): boolean {
    return this.hasRole('User');
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private setRoles(roles: string | string[] | null): void {
    const rolesArray = roles
      ? Array.isArray(roles)
        ? roles
        : [roles]
      : ['User']; // Default to ['User'] if roles are null
    localStorage.setItem(this.rolesKey, JSON.stringify(rolesArray));
  }

  private setUserId(userId: string): void {
    localStorage.setItem(this.userIdKey, userId);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.rolesKey);
    localStorage.removeItem(this.userIdKey);
    this.isLoggedInSubject.next(false);
  }
  forgotPassword(email: string): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/account/forgetpassword`,
      { email },
      { responseType: 'text' }
    );
  }

  // validateResetToken(token: string): Observable<any> {
  //   return this.http
  //     .post(`${this.apiUrl}/validate-reset-token`, { token })
  //     .pipe(
  //       tap((response) => console.log('Token validated:', response)),
  //       catchError((error) =>
  //         throwError(
  //           () => new Error('Invalid or expired token: ' + error.message)
  //         )
  //       )
  //     );
  // }

  // resetPassword(
  //   password: string,
  //   email: string,
  //   token: string
  // ): Observable<string> {
  //   const body = { password, email, token };
  //   console.log('Request body:', body);
  //   return this.http
  //     .post(`${this.apiUrl}/account/resetPassword`, body, {
  //       responseType: 'text',
  //     })
  //     .pipe(
  //       tap((response) => console.log('Reset password response:', response)),
  //       catchError((error) => {
  //         console.error('Reset password error details:', error);
  //         return throwError(
  //           () =>
  //             new Error(
  //               'Failed to reset password: ' + (error.error || error.message)
  //             )
  //         );
  //       })
  //     );
  // }
  resetPassword(
    password: string,
    email: string,
    token: string
  ): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/Account/ResetPassword`, {
        password,
        email,
        token,
      })
      .pipe(catchError(this.handleError));
  }
  // Mock methods (optional)
  validateResetToken1(token: string): Observable<any> {
    return of({ valid: true }).pipe(
      tap(() => console.log('Mock token validated:', token))
    );
  }
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Something went wrong; please try again later.';
    if (error.status === 400) {
      errorMessage = 'Invalid or expired reset token.';
    } else if (error.status === 404) {
      errorMessage = 'Email not found.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    console.error('AuthService error:', {
      status: error.status,
      message: errorMessage,
      error: error.error,
    });
    return throwError(() => new Error(errorMessage));
  }
  // resetPassword1(token: string, password: string): Observable<any> {
  //   return of({ success: true }).pipe(
  //     tap(() => console.log('Mock password reset:', token, password))
  //   );
  // }
}
