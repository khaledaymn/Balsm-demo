import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SalaryService } from '../../../../core/services/salary.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  EmployeeSalaryDetails,
  UpdateSalesPercentageRequest,
} from '../../../../models/employee-salary.model';
import { animate, style, transition, trigger } from '@angular/animations';
import { EmployeeService } from '../../../../core/services/employee.service';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface MonthOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-employee-salary-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employee-salary-details.component.html',
  styleUrls: ['./employee-salary-details.component.scss'],
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
export class EmployeeSalaryDetailsComponent implements OnInit, OnDestroy {
  isLoading = signal<boolean>(true);
  salaryDetails = signal<EmployeeSalaryDetails | null>(null);
  notification = signal<Notification | null>(null);
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  employeeId: string | null = null;
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
    salesPercentage: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    fridaySalary: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
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
    private route: ActivatedRoute,
    private salaryService: SalaryService,
    private userService: EmployeeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.hasRole('Admin')) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.employeeId = this.route.snapshot.paramMap.get('id');
    const monthParam = this.route.snapshot.queryParamMap.get('month');
    const yearParam = this.route.snapshot.queryParamMap.get('year');

    if (monthParam) {
      this.selectedMonth.set(+monthParam);
      this.filterForm.patchValue({ month: +monthParam });
    }
    if (yearParam) {
      this.selectedYear.set(+yearParam);
      this.filterForm.patchValue({ year: +yearParam });
    }

    if (this.employeeId) {
      this.loadSalaryDetails(
        this.employeeId,
        this.filterForm.get('month')!.value,
        this.filterForm.get('year')!.value
      );
    } else {
      this.showNotification('error', 'لم يتم العثور على معرف الموظف');
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
              salesPercentage: response.salesPercentage || 0,
              fridaySalary: response.fridaySalary || 0, // Optional, if not applicable
              totalSalary: response.totalSalary || 0,
              month: response.month || month,
              year: response.year || year,
            });
            this.filterForm.patchValue({
              salesPercentage: response.salesPercentage || 0,
            });
            this.filterForm.patchValue({
              fridaySalary: response.fridaySalary || 0,
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

  updateSalesPercentage(): void {
    if (!this.employeeId || !this.filterForm.valid) {
      this.showNotification('error', 'يرجى التحقق من البيانات المدخلة');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.showNotification('error', 'لم يتم العثور على رمز التوثيق');
      this.isLoading.set(false);
      return;
    }
    const request: UpdateSalesPercentageRequest = {
      employeeId: this.employeeId,
      salesPercentage: this.filterForm.get('salesPercentage')!.value,
      fridaySalary: this.filterForm.get('fridaySalary')!.value,
      month: this.filterForm.get('month')!.value,
      year: this.filterForm.get('year')!.value,
    };
    console.log('Update Sales Percentage Request:', request);

    this.isLoading.set(true);
    this.subscription.add(
      this.userService.updateSalesPercentage(request).subscribe({
        next: () => {
          this.showNotification('success', 'تم تحديث بنجاح');
          this.loadSalaryDetails(
            this.employeeId!,
            this.filterForm.get('month')!.value,
            this.filterForm.get('year')!.value
          );
        },
        error: (error) => {
          this.showNotification(
            'error',
            error.message || 'حدث خطأ أثناء تحديث نسبة المبيعات'
          );
          this.isLoading.set(false);
        },
      })
    );
  }

  onPeriodChange(): void {
    if (this.employeeId && this.filterForm.valid) {
      this.selectedMonth.set(this.filterForm.get('month')!.value);
      this.selectedYear.set(this.filterForm.get('year')!.value);
      this.loadSalaryDetails(
        this.employeeId,
        this.filterForm.get('month')!.value,
        this.filterForm.get('year')!.value
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

  closeDetails(): void {
    this.router.navigate(['/app/admin/employee-salary']);
  }
}
