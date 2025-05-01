import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Branch } from '../../models/branch.model';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private apiUrl = environment.apiUrl + '/Branchs'; // Replace with your API base URL

  constructor(private http: HttpClient) {}

  // GET /Branchs/GetAll
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // Adjust based on your token storage
    return new HttpHeaders({
      Accept: '*/*',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  getAllBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${this.apiUrl}/GetAll`, {
      headers: this.getHeaders(),
    });
  }
  addBranch(branch: Branch): Observable<Branch> {
    return this.http.post<Branch>(`${this.apiUrl}/Createbranch`, branch).pipe(
      catchError((error) => {
        console.error('Error adding branch:', error);
        return throwError(() => new Error('Failed to add branch.'));
      })
    );
  }

  // Update an existing branch
  updateBranch(branch: Branch): Observable<Branch> {
    return this.http.put<Branch>(`${this.apiUrl}/updatebranch`, branch).pipe(
      catchError((error) => {
        console.error('Error updating branch:', error);
        return throwError(() => new Error('Failed to update branch.'));
      })
    );
  }

  // Delete a branch
  deleteBranch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletebranch/${id}`).pipe(
      catchError((error) => {
        console.error('Error deleting branch:', error);
        return throwError(() => new Error('Failed to delete branch.'));
      })
    );
  }
}
