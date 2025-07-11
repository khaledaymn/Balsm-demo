import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReportsService } from '../../../core/services/reports.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  EmployeeVacation,
  EmployeeVacationDetail,
} from '../../../models/employee-vacation.model';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-employee-vacations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-vacations.component.html',
  styleUrl: './employee-vacations.component.scss',
})
export class EmployeeVacationsComponent implements OnInit, OnDestroy {
  isLoading = signal<boolean>(true);
  employeeVacation = signal<EmployeeVacation | null>(null);
  notification = signal<Notification | null>(null);
  employeeId = signal<string | null>(null);

  // Pagination
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalRecords = signal<number>(0);

  // Filters
  filterForm = new FormGroup({
    year: new FormControl<number>(new Date().getFullYear(), {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(2000),
        Validators.max(2100),
      ],
    }),
    month: new FormControl<number>(new Date().getMonth() + 1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(12)],
    }),
  });

  private subscription: Subscription = new Subscription();

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.employeeId.set(userId);
      this.loadEmployeeVacations();
      this.subscription.add(
        this.filterForm.valueChanges
          .pipe(
            debounceTime(300),
            distinctUntilChanged(
              (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
            )
          )
          .subscribe(() => {
            if (this.filterForm.valid) {
              console.log(
                'Vacation Form Value Changed:',
                this.filterForm.value
              );
              this.pageNumber.set(1);
              this.loadEmployeeVacations();
            } else {
              console.warn('Vacation Form Invalid:', this.filterForm.errors);
              this.showNotification(
                'error',
                'يرجى إدخال بيانات صالحة للفلاتر.'
              );
            }
          })
      );
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

  loadEmployeeVacations(): void {
    if (!this.employeeId()) {
      this.showNotification('error', 'معرف الموظف غير متوفر.');
      this.isLoading.set(false);
      return;
    }
    this.isLoading.set(true);
    const { year, month } = this.filterForm.value;
    this.reportsService
      .getEmployeeVacations(
        this.employeeId()!,
        this.pageNumber(),
        this.pageSize(),
        year!,
        month!
      )
      .subscribe({
        next: (response) => {
          console.log('Employee Vacations Response:', response);
          this.employeeVacation.set(response);
          this.totalRecords.set(response.employeeVacationDetails.length);
          if (!response.employeeVacationDetails.length) {
            this.showNotification(
              'info',
              'لا توجد بيانات إجازات متاحة لهذه الفلاتر.'
            );
          } else {
            this.showNotification('success', 'تم تحميل تقرير الإجازات بنجاح.');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Employee Vacations Error:', error);
          this.showNotification(
            'error',
            error.message || 'حدث خطأ أثناء تحميل بيانات الإجازات.'
          );
          this.employeeVacation.set(null);
          this.isLoading.set(false);
        },
      });
  }

  changePage(newPage: number): void {
    if (newPage >= 1) {
      this.pageNumber.set(newPage);
      this.loadEmployeeVacations();
    }
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    this.loadEmployeeVacations();
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
