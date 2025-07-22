import {
  Component,
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
import { EmployeeVacationsComponent } from '../employee-vacations/employee-vacations.component';
import { AbsenceReportComponent } from '../absence-report/absence-report.component';
import { ReportsService } from '../../../../core/services/reports.service';
import * as XLSX from 'xlsx';

// import  { ReportsService } from "./reports.service" // Declare the ReportsService import

interface AttendanceReport {
  employeeId: string;
  name: string;
  email: string;
  numberOfMonthlyWorkingHours: number;
  numberOfLateHours: number;
  numberOfAbsentDays: number;
  numberOfVacationDays: number;
  numberOfOverTime: number;
}

interface EmployeeAttendance {
  employeeName: string;
  email: string;
  date: string;
  timeOfAttend: string;
  timeOfLeave: string;
  branchName: string;
  numberOfOverTime: number;
  numberOfLateHour: number;
}

interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
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
  employeeAttendance = signal<EmployeeAttendance[]>([]);
  notification = signal<Notification | null>(null);
  showEmployeeModal = signal<boolean>(false);
  showVacationsModal = signal<boolean>(false);
  showAbsenceModal = signal<boolean>(false);
  selectedEmployeeId = signal<string | null>(null);
  selectedEmployeeName = signal<string>('');
  searchTerm = signal<string>('');

  // Pagination
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalRecords = signal<number>(0);

  // Computed properties
  filteredReports = computed(() => {
    const reports = this.attendanceReports();
    const search = this.searchTerm().toLowerCase();
    if (!search) return reports;

    return reports.filter(
      (report) =>
        report.name.toLowerCase().includes(search) ||
        report.email.toLowerCase().includes(search)
    );
  });

  employeeStats = computed(() => {
    const reports = this.filteredReports();
    return {
      totalEmployees: reports.length,
      totalWorkingHours: reports.reduce(
        (sum, r) => sum + r.numberOfMonthlyWorkingHours,
        0
      ),
      totalLateHours: reports.reduce((sum, r) => sum + r.numberOfLateHours, 0),
      totalAbsentDays: reports.reduce(
        (sum, r) => sum + r.numberOfAbsentDays,
        0
      ),
    };
  });

  // Forms
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
    dayDate: new FormControl<string>(''),
    fromDate: new FormControl<string>(''),
    toDate: new FormControl<string>(''),
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

  constructor(private reportsService: ReportsService) {} // Declare the ReportsService variable

  ngOnInit(): void {
    this.loadAttendanceReports();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private setupFormSubscriptions(): void {
    // Filter form changes
    this.subscription.add(
      this.filterForm.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => {
          if (this.filterForm.valid) {
            this.pageNumber.set(1);
            this.loadAttendanceReports();
          }
        })
    );

    // Employee filter form changes
    this.subscription.add(
      this.employeeFilterForm.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => {
          if (this.selectedEmployeeId() && this.employeeFilterForm.valid) {
            this.loadEmployeeAttendance(this.selectedEmployeeId()!);
          }
        })
    );
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
          this.showNotification('error', 'حدث خطأ أثناء تحميل تقرير الحضور.');
          this.attendanceReports.set([]);
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
      });
    }

    // Get current form values
    const { reportType, dayDate, fromDate, toDate } =
      this.employeeFilterForm.value;

    // Validate inputs
    if (
      reportType === 0 &&
      (!dayDate || !this.employeeFilterForm.controls.dayDate.valid)
    ) {
      this.showNotification('error', 'يرجى تحديد تاريخ صالح للتقرير اليومي.');
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
      this.showNotification('error', 'يرجى تحديد تواريخ صالحة للتقرير الشهري.');
      this.isLoading.set(false);
      return;
    }

    const filterParams: any = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
    };

    if (reportType == 0) {
      filterParams.dayDate = dayDate;
    } else {
      filterParams.fromDate = fromDate;
      filterParams.toDate = toDate;
    }

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
            if (response.data && response.data.length > 0) {
              // this.showNotification('success', 'تم تحميل تقرير الموظف بنجاح.');
              this.selectedEmployeeName.set(response.data[0].employeeName);
            }
          } else {
            this.showNotification('error', 'فشل في تحميل تقرير الموظف.');
          }
          this.isLoading.set(false);
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

  closeEmployeeModal(): void {
    this.showEmployeeModal.set(false);
    this.selectedEmployeeId.set(null);
    this.selectedEmployeeName.set('');
    this.employeeAttendance.set([]);
    this.employeeFilterForm.reset({
      reportType: 1,
      dayDate: '',
      fromDate: '',
      toDate: '',
    });
  }

  closeVacationsModal(): void {
    this.showVacationsModal.set(false);
    this.selectedEmployeeId.set(null);
  }

  closeAbsenceModal(): void {
    this.showAbsenceModal.set(false);
    this.selectedEmployeeId.set(null);
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    this.searchTerm.set('');
    this.pageNumber.set(1);
  }

  changePage(newPage: number): void {
    if (newPage >= 1) {
      this.pageNumber.set(newPage);
      this.loadAttendanceReports();
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  showNotification(type: Notification['type'], message: string): void {
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
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }

  getBadgeClass(
    value: number,
    threshold: number,
    type: 'danger' | 'success' = 'danger'
  ): string {
    if (type === 'danger') {
      return value > threshold ? 'badge-danger' : 'badge-secondary';
    }
    return value > threshold ? 'badge-success' : 'badge-secondary';
  }

  // Format decimal hours to hours and minutes
  formatHoursAndMinutes(decimalHours: number): string {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    if (hours === 0 && minutes === 0) {
      return '0 دقيقة';
    } else if (hours === 0) {
      return `${minutes} دقيقة`;
    } else if (minutes === 0) {
      return `${hours} ساعة`;
    } else {
      return `${hours} ساعة ${minutes} دقيقة`;
    }
  }

  // Format decimal days to days and hours
  formatDaysAndHours(decimalDays: number): string {
    const days = Math.floor(decimalDays);
    const remainingHours = Math.round((decimalDays - days) * 24);

    if (days === 0 && remainingHours === 0) {
      return '0 ساعة';
    } else if (days === 0) {
      return `${remainingHours} ساعة`;
    } else if (remainingHours === 0) {
      return `${days} يوم`;
    } else {
      return `${days} يوم ${remainingHours} ساعة`;
    }
  }

  // Format date in Arabic
  formatDateArabic(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };

    // Use Arabic locale for date formatting
    return date.toLocaleDateString('ar-SA', options);
  }

  // Format date in Arabic (short version)
  formatDateArabicShort(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return date.toLocaleDateString('ar-SA', options);
  }

  getMonthLabel(monthValue: number): string {
    const month = this.months.find((m) => m.value === monthValue);
    return month ? month.label : '';
  }
  printEmployeeAttendance(): void {
    document.body.classList.add('print-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 100);
  }
  exportData(): void {
    // Implementation for data export
    this.showNotification('info', 'جاري تصدير البيانات...');
  }
  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.employeeAttendance()
    );
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'EmployeeAttendanceList.xlsx');
  }
}
