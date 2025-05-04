import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SalaryService } from '../../core/services/salary.service';
import {
  EmployeeSalary,
  EmployeeSalaryDetails,
} from '../../models/employee-salary.model';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface SalaryItem {
  type: 'earning' | 'deduction';
  name: string;
  amount: number;
  icon: string;
  info?: string;
}

@Component({
  selector: 'app-employee-salaries',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee-salaries.component.html',
  styleUrl: './employee-salaries.component.scss',
})
export class EmployeeSalariesComponent {
  // Signals for state management
  isLoading = signal<boolean>(true);
  employees = signal<EmployeeSalary[]>([]);
  selectedEmployee = signal<EmployeeSalary | null>(null);
  salaryDetails = signal<EmployeeSalaryDetails | null>(null);
  notification = signal<Notification | null>(null);
  showDetailsModal = signal<boolean>(false);

  constructor(private salaryService: SalaryService) {
    this.loadEmployeesSalaries();
  }

  loadEmployeesSalaries(): void {
    this.isLoading.set(true);
    console.log("Loading employees' salaries...");
    this.salaryService.getAllEmployeesSalaries().subscribe({
      next: (response) => {
        console.log('Employees salaries loaded:', response);
        this.employees.set(response);
        if (response) {
          this.employees.set(response);
        } else {
          this.employees.set(response);
          console.log(response);
          this.showNotification('error', 'فشل في تحميل رواتب الموظفين.');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.showNotification('error', error.message);
        this.isLoading.set(false);
      },
    });
  }

  loadEmployeeSalaryDetails(employee: EmployeeSalary): void {
    this.selectedEmployee.set(employee);
    this.isLoading.set(true);
    const startDate = '2025-04-01'; // Fixed date range for the current month
    const endDate = '2025-04-30';

    this.salaryService
      .getEmployeeSalaryDetails(employee.employeeId, startDate, endDate)
      .subscribe({
        next: (response) => {
          if (response) {
            this.salaryDetails.set(response);
            this.showDetailsModal.set(true);
          } else {
            this.showNotification('error', 'فشل في تحميل تفاصيل راتب الموظف.');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.showNotification('error', error.message);
          this.isLoading.set(false);
        },
      });
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedEmployee.set(null);
    this.salaryDetails.set(null);
  }

  printPayslip(): void {
    window.print();
  }

  downloadPdf(): void {
    this.showNotification('info', 'جاري تحميل PDF...');
    // Implement PDF download logic here (e.g., using jsPDF)
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

  get salaryItems(): SalaryItem[] {
    const details = this.salaryDetails();
    if (!details) return [];

    return [
      {
        type: 'earning',
        name: 'الراتب الأساسي',
        amount: details.baseSalary,
        icon: 'payments',
      },
      {
        type: 'earning',
        name: 'راتب العمل الإضافي',
        amount: details.overTimeSalary,
        icon: 'schedule',
        info: `${details.overTime} ساعات`,
      },
      {
        type: 'deduction',
        name: 'خصم التأخير',
        amount: details.lateTimeSalary,
        icon: 'timer_off',
        info: `${details.lateTime} ساعات`,
      },
      {
        type: 'deduction',
        name: 'خصم أيام الغياب',
        amount: details.absentDaysSalary,
        icon: 'event_busy',
        info: `${details.numberOfAbsentDays} أيام`,
      },
    ];
  }

  get totalEarnings(): number {
    const details = this.salaryDetails();
    return details ? details.baseSalary + details.overTimeSalary : 0;
  }

  get totalDeductions(): number {
    const details = this.salaryDetails();
    return details ? details.lateTimeSalary + details.absentDaysSalary : 0;
  }

  get netSalary(): number {
    const details = this.salaryDetails();
    return details ? details.totalSalary : 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  }
}
