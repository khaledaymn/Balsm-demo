import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'; // Removed ReactiveFormsModule
import { Subscription } from 'rxjs';
import { SalaryService } from '../../../core/services/salary.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmployeeSalaryDetails } from '../../../models/employee-salary.model';
import { animate, style, transition, trigger } from '@angular/animations';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface MonthOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-salary-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule], // Removed ReactiveFormsModule
  templateUrl: './salary-details.component.html',
  styleUrl: './salary-details.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '400ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate(
          '500ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
    ]),
  ],
})
export class SalaryDetailsComponent implements OnInit, OnDestroy {
  isLoading = signal<boolean>(true);
  salaryDetails = signal<EmployeeSalaryDetails | null>(null);
  notification = signal<Notification | null>(null);
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  filterForm = new FormGroup({
    year: new FormControl(new Date().getFullYear(), [
      Validators.required,
      Validators.min(2000),
      Validators.max(2100),
    ]),
    month: new FormControl(new Date().getMonth() + 1, [
      Validators.required,
      Validators.min(1),
      Validators.max(12),
    ]),
  });
  private monthNames = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  private subscription: Subscription = new Subscription();

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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadSalaryDetails(employeeId: string, month: number, year: number): void {
    this.isLoading.set(true);
    this.subscription.add(
      this.salaryService
        .getEmployeeSalaryDetails(employeeId, month, year)
        .subscribe({
          next: (response) => {
            this.salaryDetails.set({
              employeeName: response.employeeName || '',
              baseSalary: response.baseSalary || 0,
              overTime: response.overTime || 0,
              overTimeSalary: response.overTimeSalary || 0,
              lateTime: response.lateTime || 0,
              lateTimeSalary: response.lateTimeSalary || 0,
              numberOfAbsentDays: response.numberOfAbsentDays || 0,
              absentDaysSalary: response.absentDaysSalary || 0,
              salesPresentage: response.salesPresentage || 0, // Fixed typo: salesPresentage -> salesPercentage
              totalSalary: response.totalSalary || 0,
              month: response.month || month,
              year: response.year || year,
            });
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
        })
    );
  }

  onPeriodChange(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.loadSalaryDetails(
        userId,
        this.filterForm.get('month')!.value ?? 1,
        this.filterForm.get('year')!.value ?? new Date().getFullYear()
      );
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

  getMonthOptions(): MonthOption[] {
    return this.monthNames.map((name, index) => ({
      value: index + 1,
      label: name,
    }));
  }

  getMonthName(monthNumber: number): string {
    return this.monthNames[monthNumber - 1] || monthNumber.toString();
  }

  formatDays(days: number): string {
    if (days === 0) return '0 أيام';
    const wholeDays = Math.floor(days);
    const remainingHours = Math.round((days - wholeDays) * 8);
    if (remainingHours === 0) {
      return wholeDays === 1 ? 'يوم واحد' : `${wholeDays} أيام`;
    }
    let result = '';
    if (wholeDays > 0) {
      result += wholeDays === 1 ? 'يوم واحد' : `${wholeDays} أيام`;
    }
    if (remainingHours > 0) {
      if (result) result += ' و ';
      result += remainingHours === 1 ? 'ساعة واحدة' : `${remainingHours} ساعات`;
    }
    return result;
  }

  formatHours(hours: number): string {
    if (hours === 0) return '0 ساعات';
    const wholeHours = Math.floor(hours);
    const remainingMinutes = Math.round((hours - wholeHours) * 60);
    if (remainingMinutes === 0) {
      return wholeHours === 1 ? 'ساعة واحدة' : `${wholeHours} ساعات`;
    }
    let result = '';
    if (wholeHours > 0) {
      result += wholeHours === 1 ? 'ساعة واحدة' : `${wholeHours} ساعات`;
    }
    if (remainingMinutes > 0) {
      if (result) result += ' و ';
      result +=
        remainingMinutes === 1 ? 'دقيقة واحدة' : `${remainingMinutes} دقيقة`;
    }
    return result;
  }

  getTotalDeductions(): number {
    const salary = this.salaryDetails();
    if (!salary) return 0;
    return (salary.lateTimeSalary || 0) + (salary.absentDaysSalary || 0);
  }
}
