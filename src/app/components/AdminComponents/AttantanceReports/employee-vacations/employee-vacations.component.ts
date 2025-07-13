import {
  Component,
  Input,
  signal,
  type OnInit,
  type OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReportsService } from '../../../../core/services/reports.service';
import { EmployeeVacation } from '../../../../models/employee-vacation.model';

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
  @Input() employeeId = '';

  // Signals for state management
  isLoading = signal<boolean>(true);
  employeeVacation = signal<EmployeeVacation | null>(null);
  notification = signal<Notification | null>(null);
  searchTerm = signal<string>('');

  // Pagination
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalRecords = signal<number>(0);

  // Computed properties
  filteredVacations = computed(() => {
    const vacation = this.employeeVacation();
    if (!vacation) return [];

    const details = vacation.employeeVacationDetails;
    const search = this.searchTerm().toLowerCase();

    if (!search) return details;

    return details;
  });

  vacationStats = computed(() => {
    const vacation = this.employeeVacation();
    if (!vacation) return { total: 0, used: 0, remaining: 0, pending: 0 };

    const details = vacation.employeeVacationDetails;
    return {
      total: details.length,
      // used: details.filter((d) => d.status === 'approved').length,
      // remaining: vacation.remainingVacationDays,
      // pending: details.filter((d) => d.status === 'pending').length,
    };
  });

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

  // Constants
  months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' },
  ];

  private subscription: Subscription = new Subscription();

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    if (this.employeeId) {
      this.loadEmployeeVacations();
      this.subscription.add(
        this.filterForm.valueChanges
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(() => {
            if (this.filterForm.valid) {
              this.pageNumber.set(1);
              this.loadEmployeeVacations();
            }
          })
      );
    } else {
      this.showNotification('error', 'معرف الموظف غير متوفر.');
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadEmployeeVacations(): void {
    if (!this.employeeId) {
      this.showNotification('error', 'معرف الموظف غير متوفر.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    const { year, month } = this.filterForm.value;

    this.reportsService
      .getEmployeeVacations(
        this.employeeId,
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
              'لا توجد بيانات إجازات متاحة لهذا الموظف.'
            );
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
    this.searchTerm.set('');
    this.loadEmployeeVacations();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  showNotification(type: 'success' | 'error' | 'info', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000);
  }

  dismissNotification(): void {
    this.notification.set(null);
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

  formatDateArabic(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    return date.toLocaleDateString('ar-SA', options);
  }

  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate).toLocaleDateString('ar-SA');
    const end = new Date(endDate).toLocaleDateString('ar-SA');
    return `${start} - ${end}`;
  }

  getMonthLabel(monthValue: number): string {
    const month = this.months.find((m) => m.value === monthValue);
    return month ? month.label : '';
  }
}
