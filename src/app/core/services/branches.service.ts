import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}
