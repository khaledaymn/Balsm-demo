import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environments';
import { Shift } from '../../models/shifts.model';
import { Branch } from '../../models/branch.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private rolesKey = 'auth_roles';
  private shiftsKey = 'auth_shifts';
  private userIdKey = 'auth_userId';
  private branchNameKey = 'auth_branchName';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  // Add checkAuthStatus method
  checkAuthStatus(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      this.isLoggedInSubject.next(false);
      return of(false);
    }

    // Optionally validate the token with the backend (if an endpoint exists)
    // For now, rely on the presence of the token and the isLoggedInSubject
    const isLoggedIn = this.isLoggedInSubject.value;
    return of(isLoggedIn).pipe(
      tap((status) => {
        console.log('Auth status checked:', status);
        if (!status) {
          this.logout(); // Clear stale data if not logged in
        }
      })
    );

    // If you have a backend endpoint to validate the token, you can uncomment this:
    /*
    return this.http.get(`${this.apiUrl}/Account/validate-token`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(() => {
        this.isLoggedInSubject.next(true);
        return true;
      }),
      catchError((error) => {
        console.error('Token validation failed:', error);
        this.clearAuthData();
        this.isLoggedInSubject.next(false);
        return of(false);
      })
    );
    */
  }

  login(
    email: string,
    password: string
  ): Observable<{
    token: string;
    roles: string[] | string | null;
    id: string;
    shift: Shift[];
    branch: Branch;
  }> {
    return this.http
      .post<{
        token: string;
        roles: string[] | string | null;
        id: string;
        shift: Shift[];
        branch: Branch;
      }>(`${this.apiUrl}/Account/login`, { email, password })
      .pipe(
        tap((response) => {
          console.log('Login response:', response);
          console.log('Setting branch data:', response.branch);
          this.setToken(response.token);
          this.setRoles(response.roles ?? 'User');
          this.setUserId(response.id);
          this.setShifts(response.shift);
          this.setBranchName(response.branch);
          this.isLoggedInSubject.next(true);
        }),
        catchError((error) =>
          throwError(() => new Error('Login failed: ' + error.message))
        )
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.rolesKey);
    localStorage.removeItem(this.shiftsKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.branchNameKey);
    this.isLoggedInSubject.next(false);
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

  getShifts(): Shift[] {
    const shifts = localStorage.getItem(this.shiftsKey);
    return shifts ? JSON.parse(shifts) : [];
  }

  getUserId(): string | null {
    const userId = localStorage.getItem(this.userIdKey);
    console.log('Retrieved auth_userId from localStorage:', userId);
    if (!userId) return null;
    try {
      if (userId.startsWith('{')) {
        const parsed = JSON.parse(userId);
        return parsed.id ?? null;
      }
      return userId;
    } catch (error) {
      console.error('Failed to parse userId:', error);
      return null;
    }
  }

  getBranchName(): Branch | null {
    const branch = localStorage.getItem(this.branchNameKey);
    console.log('Retrieved auth_branchName from localStorage:', branch);
    if (!branch) return null;
    try {
      const parsed = JSON.parse(branch);
      if (
        parsed &&
        typeof parsed.id === 'number' &&
        typeof parsed.name === 'string' &&
        typeof parsed.latitude === 'number' &&
        typeof parsed.longitude === 'number' &&
        typeof parsed.radius === 'number'
      ) {
        return parsed as Branch;
      }
      return null;
    } catch (error) {
      console.error('Failed to parse branch data:', error);
      return null;
    }
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
      : ['User'];
    localStorage.setItem(this.rolesKey, JSON.stringify(rolesArray));
  }

  private setShifts(shifts: Shift[]): void {
    localStorage.setItem(this.shiftsKey, JSON.stringify(shifts));
  }

  private setUserId(userId: string): void {
    console.log('Setting auth_userId in localStorage:', userId);
    localStorage.setItem(this.userIdKey, userId);
  }

  private setBranchName(branch: Branch | null): void {
    if (branch) {
      localStorage.setItem(this.branchNameKey, JSON.stringify(branch));
    } else {
      localStorage.removeItem(this.branchNameKey);
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  forgotPassword(email: string): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/account/forgetpassword`,
      { email },
      { responseType: 'text' }
    );
  }

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
}
