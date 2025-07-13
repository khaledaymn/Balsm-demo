import {
  Component,
  Input,
  signal,
  type OnInit,
  type OnDestroy,
  computed,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReportsService } from '../../../../core/services/reports.service';
import { AbsenceReport } from '../../../../models/absence-report.model';

interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Component({
  selector: 'app-absence-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './absence-report.component.html',
  styleUrl: './absence-report.component.scss',
})
export class AbsenceReportComponent implements OnInit, OnDestroy {
  @Input() employeeId = '';

  // Signals for state management
  isLoading = signal<boolean>(true);
  absenceReports = signal<AbsenceReport[]>([]);
  notification = signal<Notification | null>(null);
  searchTerm = signal<string>('');

  // Pagination
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalRecords = signal<number>(0);

  // Computed properties
  filteredAbsences = computed(() => {
    const reports = this.absenceReports();
    const allAbsences = reports.flatMap((report) =>
      report.data.map((absence) => ({
        ...absence,
        employeeName: report.employeeName,
        email: report.email,
      }))
    );

    const search = this.searchTerm().toLowerCase();
    if (!search) return allAbsences;

    return allAbsences.filter((absence) =>
      absence.date.toLowerCase().includes(search)
    );
  });

  absenceStats = computed(() => {
    const absences = this.filteredAbsences();
    const totalHours = absences.reduce(
      (sum, absence) => sum + absence.hours,
      0
    );

    return {
      total: absences.length,
      totalHours: totalHours,
      averageHours: absences.length > 0 ? totalHours / absences.length : 0,
    };
  });

  // Filters
  absenceFilterForm = new FormGroup({
    reportType: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dayDate: new FormControl<string>(''),
    fromDate: new FormControl<string>(''),
    toDate: new FormControl<string>(''),
  });

  private subscription: Subscription = new Subscription();

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    if (this.employeeId) {
      this.initializeFilters();
      this.loadAbsenceReport();
      this.setupFormSubscriptions();
    } else {
      this.showNotification('error', 'معرف الموظف غير متوفر.');
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private initializeFilters(): void {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(
      currentYear,
      currentMonth - 1,
      new Date(currentYear, currentMonth, 0).getDate()
    );

    this.absenceFilterForm.patchValue({
      reportType: 1,
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: lastDay.toISOString().split('T')[0],
    });
  }

  private setupFormSubscriptions(): void {
    this.subscription.add(
      this.absenceFilterForm.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(
            (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
          )
        )
        .subscribe(() => {
          if (this.absenceFilterForm.valid) {
            console.log(
              'Absence Form Value Changed:',
              this.absenceFilterForm.value
            );
            this.pageNumber.set(1);
            this.loadAbsenceReport();
          } else {
            console.warn(
              'Absence Form Invalid:',
              this.absenceFilterForm.errors
            );
            this.showNotification('error', 'يرجى إدخال بيانات صالحة للفلاتر.');
          }
        })
    );
  }

  loadAbsenceReport(): void {
    if (!this.employeeId) {
      this.showNotification('error', 'معرف الموظف غير متوفر.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    const { reportType, dayDate, fromDate, toDate } =
      this.absenceFilterForm.value;

    if (
      reportType === 0 &&
      (!dayDate || !this.absenceFilterForm.controls.dayDate.valid)
    ) {
      this.showNotification(
        'error',
        'يرجى تحديد تاريخ صالح للتقرير اليومي (YYYY-MM-DD).'
      );
      this.isLoading.set(false);
      return;
    }

    const filterParams: any = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
    };

    if (reportType === 0) {
      filterParams.dayDate = dayDate;
    } else {
      filterParams.fromDate = fromDate;
      filterParams.toDate = toDate;
    }

    console.log('Absence Report Filter Params:', {
      employeeId: this.employeeId,
      reportType,
      filterParams,
    });

    this.reportsService
      .getAbsenceReport(this.employeeId, reportType!, filterParams)
      .subscribe({
        next: (response) => {
          console.log('Absence Report Response:', response);
          if (response.success) {
            this.absenceReports.set(response.data || []);
            this.totalRecords.set(
              response.data?.reduce(
                (sum, report) => sum + report.data.length,
                0
              ) || 0
            );
          } else {
            this.absenceReports.set([]);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Absence Report Error:', error);
          this.absenceReports.set([]);
          this.isLoading.set(false);
        },
      });
  }

  changePage(newPage: number): void {
    if (newPage >= 1) {
      this.pageNumber.set(newPage);
      this.loadAbsenceReport();
    }
  }

  resetFilters(): void {
    this.initializeFilters();
    this.searchTerm.set('');
    this.loadAbsenceReport();
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

  formatDecimalHours(decimalHours: number): string {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    if (hours === 0) {
      return `${minutes} دقيقة`;
    } else if (minutes === 0) {
      return `${hours} ساعة`;
    } else {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
  }
}
