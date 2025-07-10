import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ReportsService } from '../../core/services/reports.service';
import { AttendanceReport } from '../../models/attendance-report.model';
import { EmployeeAttendanceLeaveReport } from '../../models/employee-attendance-leave.model';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  selectedEmployeeId = signal<string | null>(null);

  // Pagination
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalRecords = signal<number>(0);

  // Filters
  filterForm = new FormGroup({
    year: new FormControl<number>(new Date().getFullYear(), {
      nonNullable: true,
    }),
    month: new FormControl<number>(new Date().getMonth() + 1, {
      nonNullable: true,
    }),
  });

  employeeFilterForm = new FormGroup({
    reportType: new FormControl<number>(1, { nonNullable: true }), // Default to monthly
    dayDate: new FormControl<string>(''),
    fromDate: new FormControl<string>(''),
    toDate: new FormControl<string>(''),
    month: new FormControl<number | null>(null),
  });

  private subscription: Subscription = new Subscription();

  constructor(private reportsService: ReportsService) {
    // Load initial data
    this.loadAttendanceReports();
  }

  ngOnInit(): void {
    // Subscribe to employee filter form changes
    this.subscription.add(
      this.employeeFilterForm.valueChanges.subscribe(() => {
        if (this.selectedEmployeeId()) {
          this.pageNumber.set(1);
          this.loadEmployeeAttendance(this.selectedEmployeeId()!);
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
    this.reportsService
      .getAttendanceReport(this.pageNumber(), this.pageSize(), year!, month!)
      .subscribe({
        next: (response) => {
          console.log('Attendance Reports Response:', response);
          if (response.success) {
            this.attendanceReports.set(response.data);
            this.totalRecords.set(response.data.length); // Update if API provides total count
          } else {
            this.showNotification('error', 'فشل في تحميل تقرير الحضور.');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Attendance Reports Error:', error);
          this.showNotification('error', error.message);
          this.isLoading.set(false);
        },
      });
  }

  loadEmployeeAttendance(employeeId: string): void {
    this.selectedEmployeeId.set(employeeId);
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
        month,
      });
    }

    // Use current form values
    const { reportType, dayDate, fromDate, toDate } =
      this.employeeFilterForm.value;

    const filterParams: any = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
    };

    if (reportType === 0 && dayDate) {
      filterParams.dayDate = dayDate;
    } else if (reportType === 1) {
      filterParams.fromDate = fromDate || '';
      filterParams.toDate = toDate || '';
      filterParams.month = this.filterForm.value.month!;
    }

    console.log('Employee Attendance Filter Params:', filterParams);

    this.reportsService
      .getEmployeeAttendanceAndLeaveReport(
        employeeId,
        reportType!,
        filterParams
      )
      .subscribe({
        next: (response) => {
          console.log('Employee Attendance Response:', response);
          if (response.success) {
            this.employeeAttendance.set(response.data);
            this.showEmployeeModal.set(true);
          } else {
            this.showNotification('error', 'فشل في تحميل تقرير الموظف.');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Employee Attendance Error:', error);
          this.showNotification('error', error.message);
          this.isLoading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.pageNumber.set(1);
    this.loadAttendanceReports();
  }

  onEmployeeFilterChange(): void {
    // Handled by valueChanges subscription
  }

  changePage(newPage: number): void {
    if (newPage >= 1) {
      this.pageNumber.set(newPage);
      this.loadAttendanceReports();
    }
  }

  closeEmployeeModal(): void {
    this.showEmployeeModal.set(false);
    this.selectedEmployeeId.set(null);
    this.employeeAttendance.set([]);
    this.employeeFilterForm.reset({ reportType: 1 });
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
