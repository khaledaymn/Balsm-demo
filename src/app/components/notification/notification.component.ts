import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../models/notification.model';

interface NotificationFilter {
  searchTerm: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationsComponent {
  isLoading = signal<boolean>(true);
  notifications = signal<Notification[]>([]);
  filteredNotifications = signal<Notification[]>([]);
  notificationFilter = signal<NotificationFilter>({ searchTerm: '' });
  notification = signal<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  constructor(private notificationService: NotificationService) {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        this.notifications.set(response);
        this.filteredNotifications.set(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.showNotification('error', error.message);
        this.isLoading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value.toLowerCase();
    this.notificationFilter.set({ searchTerm });
    this.filterNotifications();
  }

  filterNotifications(): void {
    const { searchTerm } = this.notificationFilter();
    const filtered = this.notifications().filter(
      (notification) =>
        notification.message.toLowerCase().includes(searchTerm) ||
        notification.title.toLowerCase().includes(searchTerm)
    );
    this.filteredNotifications.set(filtered);
  }

  showNotification(type: 'success' | 'error' | 'info', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.dismissNotification(), 5000); // Match animation duration + buffer
  }

  dismissNotification(): void {
    const notificationElement = document.querySelector('.notification');
    if (notificationElement) {
      notificationElement.classList.add('slide-out');
      notificationElement.addEventListener(
        'animationend',
        () => {
          this.notification.set(null);
        },
        { once: true }
      ); // Ensure the event listener runs only once
    } else {
      this.notification.set(null);
    }
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

  acceptNotification(notification: Notification): void {
    this.isLoading.set(true);
    this.notificationService
      .takeLeaveByAdmin({
        employeeId: notification.employeeId,
        shiftId: notification.shiftId,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showNotification(
              'success',
              `تم تسجيل المغادرة بنجاح: ${notification.title}`
            );
            const updatedNotifications = this.notifications().filter(
              (n) => n.id !== notification.id
            );
            this.notifications.set(updatedNotifications);
            this.filteredNotifications.set(updatedNotifications);
          } else {
            this.showNotification('error', 'فشل في تسجيل المغادرة.');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.showNotification('error', error.message);
          this.isLoading.set(false);
        },
      });
  }

  ignoreNotification(notification: Notification): void {
    this.isLoading.set(true);
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: (response) => {
        this.showNotification('success', response || 'تم حذف الإشعار بنجاح');
        const updatedNotifications = this.notifications().filter(
          (n) => n.id !== notification.id
        );
        this.notifications.set(updatedNotifications);
        this.filteredNotifications.set(updatedNotifications);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.showNotification('error', error.message);
        this.isLoading.set(false);
      },
    });
  }

  formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
