import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import * as XLSX from 'xlsx';
import { Employee } from '../../models/employee.model';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee-salaries.component.html',
  styleUrls: ['./employee-salaries.component.scss'],
})
export class EmployeeSalariesComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  searchTerm: string = '';
  sortField: keyof Employee | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  notification: Notification | null = null;
  employeeToDelete: Employee | null = null;

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.hasRole('Admin')) {
      this.loadEmployees();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  public loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        console.log('Employees loaded:', response.data);
        this.employees = response.data.map((employee) => ({
          ...employee,
          name: employee.name || '',
          email: employee.email || '',
          phoneNumber: employee.phoneNumber || '',
          address: employee.address || '',
          nationalId: employee.nationalId || '',
          salary: employee.salary ?? 0,
          shift: employee.shift || [],
          branch: employee.branch || [],
          gender: employee.gender || '',
          hiringDate: employee.hiringDate || '',
          dateOfBarth: employee.dateOfBarth || '',
          roles: employee.roles || [],
        }));
        this.filteredEmployees = [...this.employees];
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
        this.showNotification('فشل في تحميل قائمة الموظفين', 'error');
      },
    });
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('ar-EG');
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('ar-EG');
  }

  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredEmployees);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'EmployeeList.xlsx');
  }

  printEmployeeList(): void {
    document.body.classList.add('print-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 100);
  }

  onSearchChange(): void {
    this.filteredEmployees = this.employees.filter(
      (employee) =>
        employee.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  sortBy(field: keyof Employee): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredEmployees.sort((a, b) => {
      const valueA = a[field] ?? '';
      const valueB = b[field] ?? '';
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      return this.sortDirection === 'asc'
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number);
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filteredEmployees = [...this.employees];
    this.sortField = '';
    this.sortDirection = 'asc';
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 3000);
  }

  isAdmin(): boolean {
    return this.authService.hasRole('Admin');
  }
}
