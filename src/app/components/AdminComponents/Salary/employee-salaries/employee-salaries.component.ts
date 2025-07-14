import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SalaryService } from '../../../../core/services/salary.service';
import { AuthService } from '../../../../core/services/auth.service';
import * as XLSX from 'xlsx';
import { EmployeeSalary, EmployeeSalaryDetails } from '../../../../models/employee-salary.model';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-employee-salaries',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-salaries.component.html',
  styleUrls: ['./employee-salaries.component.scss'],
})
export class EmployeeSalariesComponent implements OnInit, OnDestroy {
  employeeSalaries = signal<EmployeeSalary[]>([]);
  employeeSalaryDetails = signal<EmployeeSalaryDetails[]>([]);
  notification = signal<Notification | null>(null);
  searchTerm = signal<string>('');
  sortField = signal<keyof EmployeeSalary | ''>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  isLoading = signal<boolean>(true);

  // Pagination
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalRecords = signal<number>(0);

  // Filters
  filterForm = new FormGroup({
    year: new FormControl<number>(new Date().getFullYear(), {
      nonNullable: true,
      validators: [Validators.required, Validators.min(2000), Validators.max(2100)],
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

  // Computed properties
  filteredSalaries = computed(() => {
    const salaries = this.employeeSalaries();
    const search = this.searchTerm().toLowerCase();
    if (!search) return salaries;

    return salaries.filter(
      (salary) =>
        salary.employeeName.toLowerCase().includes(search) ||
        salary.employeeId.toLowerCase().includes(search)
    );
  });

  salaryStats = computed(() => {
    const salaries = this.filteredSalaries();
    const totalSalary = salaries.reduce((sum, salary) => sum + salary.netSalary, 0);
    return {
      totalEmployees: salaries.length,
      totalSalary: totalSalary,
      averageSalary: salaries.length > 0 ? totalSalary / salaries.length : 0,
    };
  });

  private subscription: Subscription = new Subscription();

  constructor(
    private salaryService: SalaryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.hasRole('Admin')) {
      this.loadSalaries();
      this.subscription.add(
        this.filterForm.valueChanges
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(() => {
            if (this.filterForm.valid) {
              this.pageNumber.set(1);
              this.loadSalaries();
            }
          })
      );
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadSalaries(): void {
    this.isLoading.set(true);
    const { year, month } = this.filterForm.value;

    this.salaryService.getAllEmployeesSalaries(month!, year! ).subscribe({
      next: (salaries) => {

        const filteredSalaries = salaries.map(salary => ({
          ...salary
         
        }));
        console.log(salaries);
        
        // const filteredSalaries = salariesWithDate.filter(
        //   (salary) => salary.year === year && salary.month === month
        // );
        this.employeeSalaries.set(filteredSalaries);
        this.totalRecords.set(filteredSalaries.length);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load salaries:', err);
        // this.showNotification('فشل في تحميل رواتب الموظفين', 'error');
        this.isLoading.set(false);
      },
    });
  }

  loadSalaryDetailsForExport(): Observable<EmployeeSalaryDetails[]> {
    const { year, month } = this.filterForm.value;
    const observables: Observable<EmployeeSalaryDetails>[] = this.employeeSalaries().map((salary) =>
      this.salaryService.getEmployeeSalaryDetails(salary.employeeId, month!, year!)
    );
    return new Observable((observer) => {
      Promise.all(observables.map((obs) => obs.toPromise()))
        .then((details) => {
          this.employeeSalaryDetails.set(details as EmployeeSalaryDetails[]);
          observer.next(details as EmployeeSalaryDetails[]);
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }

  exportToExcel(): void {
    this.loadSalaryDetailsForExport().subscribe({
      next: (details) => {
        const exportData = details.map((detail) => ({
          'اسم الموظف': detail.employeeName,
          
          'الراتب الأساسي': detail.baseSalary,
          'ساعات العمل الإضافي': this.formatHours(detail.overTime),
          'راتب العمل الإضافي': detail.overTimeSalary,
          'ساعات التأخير': this.formatHours(detail.lateTime),
          'خصم التأخير': detail.lateTimeSalary,
          'عدد أيام الغياب': detail.numberOfAbsentDays,
          'خصم أيام الغياب': detail.absentDaysSalary,
          'إجمالي الراتب': detail.totalSalary,
          'الشهر': this.getMonthLabel(detail.month),
          'السنة': detail.year,
        }));
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'EmployeeSalaries');
        XLSX.writeFile(wb, `EmployeeSalaries.xlsx`);
      },
      error: (err) => {
        console.error('Failed to export salaries:', err);
        // this.showNotification('فشل في تصدير البيانات إلى Excel', 'error');
      },
    });
  }

  printEmployeeList(): void {
    document.body.classList.add('print-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 100);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  sortBy(field: keyof EmployeeSalary): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }

    this.employeeSalaries.set(
      [...this.employeeSalaries()].sort((a, b) => {
        const valueA = a[field] ?? '';
        const valueB = b[field] ?? '';
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return this.sortDirection() === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
        return this.sortDirection() === 'asc'
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number);
      })
    );
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    this.searchTerm.set('');
    this.sortField.set('');
    this.sortDirection.set('asc');
  }

  showNotification(type: 'success' | 'error' | 'info', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000);
  }

  dismissNotification(): void {
    this.notification.set(null);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('ar-SA');
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('ar-SA');
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

  changePage(newPage: number): void {
    if (newPage >= 1) {
      this.pageNumber.set(newPage);
      this.loadSalaries();
    }
  }

  isAdmin(): boolean {
    return this.authService.hasRole('Admin');
  }
}