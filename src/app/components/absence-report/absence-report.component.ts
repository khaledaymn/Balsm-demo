import { Component, Input, signal, OnInit, OnDestroy } from '@angular/core';
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
import {
  AbsenceReport,
  AbsenceDetail,
} from '../../models/absence-report.model';

interface Notification {
  type: 'success' | 'error' | 'info';
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
  @Input() employeeId: string = '';

  // Signals for state management
  isLoading = signal<boolean>(true);
  absenceReports = signal<AbsenceReport[]>([]);
  notification = signal<Notification | null>(null);

  // Pagination
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalRecords = signal<number>(0);

  // Filters
  absenceFilterForm = new FormGroup({
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

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    if (this.employeeId) {
      this.loadAbsenceReport();
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
              this.showNotification(
                'error',
                'يرجى إدخال بيانات صالحة للفلاتر.'
              );
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

    const { reportType, dayDate, fromDate, toDate, month } =
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
    // if (
    //   reportType === 1 &&
    //   (!fromDate ||
    //     !toDate ||
    //     !this.absenceFilterForm.controls.fromDate.valid ||
    //     !this.absenceFilterForm.controls.toDate.valid)
    // ) {
    //   this.showNotification(
    //     'error',
    //     'يرجى تحديد تواريخ صالحة للتقرير الشهري (YYYY-MM-DD).'
    //   );
    //   this.isLoading.set(false);
    //   return;
    // }

    const filterParams: any = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
    };
    if (reportType === 0) {
      filterParams.dayDate = dayDate;
    } else {
      filterParams.fromDate = fromDate;
      filterParams.toDate = toDate;
      // filterParams.month = month || new Date().getMonth() + 1;
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
            if (
              !response.data ||
              response.data.length === 0 ||
              response.data.every((report) => report.data.length === 0)
            ) {
              // this.showNotification(
              //   'info',
              //   'لا توجد بيانات غياب متاحة لهذه الفلاتر.'
              // );
            } else {
              // this.showNotification('success', 'تم تحميل تقرير الغياب بنجاح.');
            }
          } else {
            // this.showNotification('error', 'فشل في تحميل تقرير الغياب.');
            this.absenceReports.set([]);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Absence Report Error:', error);
          // this.showNotification(
          //   'error',
          //   error.message || 'حدث خطأ أثناء تحميل تقرير الغياب.'
          // );
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
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(
      currentYear,
      currentMonth - 1,
      new Date(currentYear, currentMonth, 0).getDate()
    );
    this.absenceFilterForm.reset({
      reportType: 1,
      dayDate: '',
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: lastDay.toISOString().split('T')[0],
      month: currentMonth,
    });
    this.loadAbsenceReport();
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
