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
      this.loadAbsenceReport();
      this.subscription.add(
        this.filterForm.valueChanges
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(() => {
            if (this.filterForm.valid) {
              this.pageNumber.set(1);
              this.loadAbsenceReport();
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

  loadAbsenceReport(): void {
    if (!this.employeeId) {
      this.showNotification('error', 'معرف الموظف غير متوفر.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    const { year, month } = this.filterForm.value;

    this.reportsService
      .getAbsenceReport(
        this.employeeId,
        1, // Monthly report
        {
          pageNumber: this.pageNumber(),
          pageSize: this.pageSize(),
          // year: year!,
          month: month!,
        }
      )
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
 this.showNotification(
            'error',
            'حدث خطأ أثناء تحميل بيانات الغيابات.'
          );          this.absenceReports.set([]);
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
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
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

  formatHours(totalHours: number): string {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours} ساعة و ${minutes} دقيقة`;
  }

  getMonthLabel(monthValue: number): string {
    const month = this.months.find((m) => m.value === monthValue);
    return month ? month.label : '';
  }
}