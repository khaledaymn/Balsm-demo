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
import { ReportsService } from '../../core/services/reports.service';
import { AttendanceReport } from '../../models/attendance-report.model';
import { EmployeeAttendanceLeaveReport } from '../../models/employee-attendance-leave.model';
import { EmployeeVacationsComponent } from '../employee-vacations/employee-vacations.component';
import { AbsenceReportComponent } from '../absence-report/absence-report.component';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmployeeVacationsComponent,
    AbsenceReportComponent,
  ],
  templateUrl: './attendance-reports.component.html',
  styleUrl: './attendance-reports.component.scss',
})
export class AttendanceReportsComponent implements OnInit, OnDestroy {
  // Signals for state management
  isLoading = signal<boolean>(true);
  attendanceReports = signal<AttendanceReport[]>([]);
  employeeAttendance = signal<EmployeeAttendanceLeaveReport[]>([]);
  notification = signal<Notification | null>(null);
  showEmployeeModal = signal<boolean>(false);
  showVacationsModal = signal<boolean>(false);
  showAbsenceModal = signal<boolean>(false);

  selectedEmployeeId = signal<string | null>(null);
  employeeId!: string;
  loading!: boolean;
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

  employeeFilterForm = new FormGroup({
    reportType: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dayDate: new FormControl<string>('', {
      validators: [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    fromDate: new FormControl<string>('', {
      validators: [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    toDate: new FormControl<string>('', {
      validators: [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    month: new FormControl<number | null>(null),
  });

  private subscription: Subscription = new Subscription();

  constructor(private reportsService: ReportsService) {
    this.loadAttendanceReports();
  }

  ngOnInit(): void {
    this.subscription.add(
      this.employeeFilterForm.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(
            (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
          )
        )
        .subscribe(() => {
          if (this.selectedEmployeeId() && this.employeeFilterForm.valid) {
            console.log('Form Value Changed:', this.employeeFilterForm.value);
            this.pageNumber.set(1);
            this.loadEmployeeAttendance(this.selectedEmployeeId()!);
          } else if (!this.employeeFilterForm.valid) {
            console.warn('Form Invalid:', this.employeeFilterForm.errors);
            this.showNotification('error', 'يرجى إدخال بيانات صالحة للفلاتر.');
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAttendanceReports(): void {
    this.isLoading.set(true);
    const { year, month } = this.filterForm.value;
    if (!year || !month) {
      this.showNotification('error', 'يرجى تحديد السنة والشهر.');
      this.isLoading.set(false);
      return;
    }
    this.reportsService
      .getAttendanceReport(this.pageNumber(), this.pageSize(), year!, month!)
      .subscribe({
        next: (response) => {
          console.log('Attendance Reports Response:', response);
          if (response.success) {
            this.attendanceReports.set(response.data || []);
            this.totalRecords.set(response.data?.length || 0);
          } else {
            this.showNotification('error', 'فشل في تحميل تقرير الحضور.');
            this.attendanceReports.set([]);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Attendance Reports Error:', error);
          this.showNotification(
            'error',
            error.message || 'حدث خطأ أثناء تحميل تقرير الحضور.'
          );
          this.attendanceReports.set([]);
          this.isLoading.set(false);
        },
      });
  }

  loadEmployeeAttendance(employeeId: string): void {
    this.selectedEmployeeId.set(employeeId);
    this.employeeId = employeeId;
    this.isLoading.set(true);

    // Initialize form only on first modal open
    if (!this.showEmployeeModal()) {
      const { year, month } = this.filterForm.value;
      const firstDay = new Date(year!, month! - 1, 1);
      const lastDay = new Date(
        year!,
        month! - 1,
        new Date(year!, month!, 0).getDate()
      );
      const fromDate = firstDay.toISOString().split('T')[0];
      const toDate = lastDay.toISOString().split('T')[0];

      this.employeeFilterForm.patchValue({
        reportType: 1,
        fromDate,
        toDate,
        dayDate: '',
        month: null,
      });
    }

    // Get current form values
    const { reportType, dayDate, fromDate, toDate } =
      this.employeeFilterForm.value;
    console.log(this.employeeFilterForm.value);
    // Validate inputs
    if (
      reportType === 0 &&
      (!dayDate || !this.employeeFilterForm.controls.dayDate.valid)
    ) {
      this.showNotification(
        'error',
        'يرجى تحديد تاريخ صالح للتقرير اليومي (YYYY-MM-DD).'
      );
      this.isLoading.set(false);
      return;
    }
    if (
      reportType === 1 &&
      (!fromDate ||
        !toDate ||
        !this.employeeFilterForm.controls.fromDate.valid ||
        !this.employeeFilterForm.controls.toDate.valid)
    ) {
      this.showNotification(
        'error',
        'يرجى تحديد تواريخ صالحة للتقرير الشهري (YYYY-MM-DD).'
      );
      this.isLoading.set(false);
      return;
    }

    const filterParams: any = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
    };

    if (reportType == 0) {
      filterParams.dayDate = dayDate;
      console.log(reportType);
    } else {
      filterParams.fromDate = fromDate;
      filterParams.toDate = toDate;
    }

    console.log('Employee Attendance Filter Params:', {
      employeeId,
      reportType,
      filterParams,
    });

    this.reportsService
      .getEmployeeAttendanceAndLeaveReport(
        employeeId,
        reportType!,
        filterParams
      )
      .subscribe({
        next: (response) => {
          this.showEmployeeModal.set(true);

          if (response.success) {
            this.employeeAttendance.set(response.data || []);
            if (!response.data || response.data.length === 0) {
              this.loading = true;
            } else {
              this.showNotification('success', 'تم تحميل تقرير الموظف بنجاح.');
            }
          } else {
            this.showNotification('error', 'فشل في تحميل تقرير الموظف.');
            // this.employeeAttendance.set([]);
          }
          // this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Employee Attendance Error:', error);
          this.showNotification(
            'error',
            error.message || 'حدث خطأ أثناء تحميل تقرير الموظف.'
          );
          this.employeeAttendance.set([]);
          this.isLoading.set(false);
        },
      });
  }
  showVacations(employeeId: string): void {
    this.selectedEmployeeId.set(employeeId);
    this.showVacationsModal.set(true);
  }
  showAbsenceReport(employeeId: string): void {
    this.selectedEmployeeId.set(employeeId);
    this.showAbsenceModal.set(true);
  }
  closeVacationsModal(): void {
    this.showVacationsModal.set(false);
    this.selectedEmployeeId.set(null);
  }
  closeAbsenceModal(): void {
    this.showAbsenceModal.set(false);
    this.selectedEmployeeId.set(null);
  }
  onFilterChange(): void {
    if (this.filterForm.valid) {
      this.pageNumber.set(1);
      this.loadAttendanceReports();
    }
  }

  changePage(newPage: number): void {
    if (newPage >= 1) {
      this.pageNumber.set(newPage);
      this.loadAttendanceReports();
    }
  }

  closeEmployeeModal(): void {
    this.isLoading.set(false);

    this.showEmployeeModal.set(false);
    this.selectedEmployeeId.set(null);
    this.employeeAttendance.set([]);
    this.employeeFilterForm.reset({
      reportType: 1,
      dayDate: '',
      fromDate: '',
      toDate: '',
      month: null,
    });
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    this.onFilterChange();
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
