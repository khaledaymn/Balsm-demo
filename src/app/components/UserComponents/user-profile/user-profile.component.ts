import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { Employee } from '../../../models/employee.model';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('expand', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class UserProfileComponent implements OnInit {
  isLoading = signal<boolean>(true);
  employee = signal<Employee | null>(null);
  notification = signal<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  isShiftsExpanded = signal<boolean>(false);

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.loadEmployee(userId);
    } else {
      this.showNotification(
        'error',
        'معرف الموظف غير متوفر. يرجى تسجيل الدخول.'
      );
      this.isLoading.set(false);
    }
  }

  loadEmployee(id: string): void {
    this.isLoading.set(true);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        console.log('Employee Profile Response:', response);
        if (response.success && response.data) {
          this.employee.set(response.data);
          this.showNotification(
            'success',
            'تم تحميل بيانات الملف الشخصي بنجاح.'
          );
        } else {
          this.showNotification(
            'error',
            response.message || 'فشل في تحميل بيانات الملف الشخصي.'
          );
          this.employee.set(null);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Employee Profile Error:', error);
        this.showNotification(
          'error',
          error.message || 'حدث خطأ أثناء تحميل بيانات الملف الشخصي.'
        );
        this.employee.set(null);
        this.isLoading.set(false);
      },
    });
  }

  toggleShifts(): void {
    this.isShiftsExpanded.set(!this.isShiftsExpanded());
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
