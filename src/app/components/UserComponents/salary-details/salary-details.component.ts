import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalaryService } from '../../../core/services/salary.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmployeeSalaryDetails } from '../../../models/employee-salary.model';
import { animate, style, transition, trigger } from '@angular/animations';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-salary-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './salary-details.component.html',
  styleUrl: './salary-details.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class SalaryDetailsComponent implements OnInit {
  isLoading = signal<boolean>(true);
  salaryDetails = signal<EmployeeSalaryDetails | null>(null);
  notification = signal<Notification | null>(null);
  selectedMonth = signal<number>(new Date().getMonth() + 1); // Current month (1-12)
  selectedYear = signal<number>(new Date().getFullYear()); // Current year (2025)

  constructor(
    private salaryService: SalaryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.loadSalaryDetails(userId, this.selectedMonth(), this.selectedYear());
    } else {
      this.showNotification(
        'error',
        'معرف الموظف غير متوفر. يرجى تسجيل الدخول.'
      );
      this.isLoading.set(false);
    }
  }

  loadSalaryDetails(employeeId: string, month: number, year: number): void {
    this.isLoading.set(true);
    this.salaryService
      .getEmployeeSalaryDetails(employeeId, month, year)
      .subscribe({
        next: (response) => {
          console.log('Salary Details Response:', response);
          this.salaryDetails.set(response);
          this.showNotification('success', 'تم تحميل تفاصيل الراتب بنجاح.');
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Salary Details Error:', error);
          this.showNotification(
            'error',
            error.message || 'حدث خطأ أثناء تحميل تفاصيل الراتب.'
          );
          this.salaryDetails.set(null);
          this.isLoading.set(false);
        },
      });
  }

  onPeriodChange(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.loadSalaryDetails(userId, this.selectedMonth(), this.selectedYear());
    }
  }

  showNotification(type: 'success' | 'error' | 'info', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }
}
