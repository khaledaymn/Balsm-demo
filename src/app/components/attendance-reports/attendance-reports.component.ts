import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
export class AttendanceReportsComponent {
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
    reportType: new FormControl<number>(0, { nonNullable: true }),
    dayDate: new FormControl<string>(''),
    fromDate: new FormControl<string>(''),
    toDate: new FormControl<string>(''),
    month: new FormControl<number | null>(null),
  });

  constructor(private reportsService: ReportsService) {
    // Load initial data
    this.loadAttendanceReports();
  }

  loadAttendanceReports(): void {
    this.isLoading.set(true);
    const { year, month } = this.filterForm.value;
    this.reportsService
      .getAttendanceReport(this.pageNumber(), this.pageSize(), year!, month!)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.attendanceReports.set(response.data);
            this.totalRecords.set(response.data.length); // Update if API provides total count
          } else {
            this.showNotification('error', 'فشل في تحميل تقرير الحضور.');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.showNotification('error', error.message);
          this.isLoading.set(false);
        },
      });
  }

  loadEmployeeAttendance(employeeId: string): void {
    this.selectedEmployeeId.set(employeeId);
    this.isLoading.set(true);
    const { reportType, dayDate, fromDate, toDate, month } =
      this.employeeFilterForm.value;
    this.reportsService
      .getEmployeeAttendanceAndLeaveReport(employeeId, reportType!, {
        pageNumber: this.pageNumber(),
        pageSize: this.pageSize(),
        dayDate: dayDate || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        month: month || undefined,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.employeeAttendance.set(response.data);
            this.showEmployeeModal.set(true);
          } else {
            this.showNotification('error', 'فشل في تحميل تقرير الموظف.');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
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
    if (this.selectedEmployeeId()) {
      this.pageNumber.set(1);
      this.loadEmployeeAttendance(this.selectedEmployeeId()!);
    }
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
    this.employeeFilterForm.reset({ reportType: 0 });
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
