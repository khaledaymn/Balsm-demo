import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';

interface Holiday {
  id: string;
  vacationName: string;
  vacationDay: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-official-holidays',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './holidays.component.html',
  styleUrls: ['./holidays.component.scss'],
})
export class HolidaysComponent {
  holidays = signal<Holiday[]>([]);
  filteredHolidays = signal<Holiday[]>([]);
  selectedHoliday = signal<Holiday | null>(null);
  isAddModalOpen = signal(false);
  isEditModalOpen = signal(false);
  isDeleteModalOpen = signal(false);
  notification = signal<Notification | null>(null);

  newHoliday: Holiday = this.getEmptyHoliday();
  yearFilter = signal<number | undefined>(undefined);
  searchTerm = signal('');
  nameError = signal<string | null>(null);
  dateError = signal<string | null>(null);

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.hasRole('Admin')) {
      this.loadHolidays();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('ar-SA');
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('ar-SA');
  }

  printHolidayList(): void {
    document.body.classList.add('print-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 100);
  }

  private normalizeDate(dateString: string): string {
    // Convert YYYY/MM/DD to YYYY-MM-DD for consistent parsing
    return dateString.replace(/\//g, '-');
  }

  private async loadHolidays(): Promise<void> {
    try {
      const holidays = await this.employeeService.getOfficialHolidays();
      console.log('API Response:', holidays);

      // Map holidays to ensure correct structure
      const mappedHolidays: Holiday[] = holidays.map((holiday: any) => ({
        id: String(holiday.id ?? ''),
        vacationName: holiday.vacationName ?? '',
        vacationDay: this.normalizeDate(holiday.vacationDay ?? ''),
      }));

      console.log('Mapped Holidays:', mappedHolidays);
      this.holidays.set(mappedHolidays);
      this.applyFilters();
      console.log('Filtered Holidays:', this.filteredHolidays());
    } catch (err) {
      console.error('Failed to load holidays:', err);
      this.showNotification({
        message: 'فشل في تحميل الإجازات الرسمية',
        type: 'error',
      });
      this.holidays.set([]);
      this.filteredHolidays.set([]);
    }
  }

  applyFilters(): void {
    let filtered = [...this.holidays()];
    console.log('Applying Filters - Initial Data:', filtered);

    if (this.yearFilter() !== undefined) {
      filtered = filtered.filter((holiday) => {
        const date = new Date(holiday.vacationDay);
        if (isNaN(date.getTime())) {
          console.warn(
            `Invalid date for holiday: ${holiday.vacationName}, Date: ${holiday.vacationDay}`
          );
          return false;
        }
        const year = date.getFullYear();
        const matches = year === this.yearFilter();
        console.log(
          `Filter Year - Holiday: ${holiday.vacationName}, Date: ${holiday.vacationDay}, Year: ${year}, Matches: ${matches}`
        );
        return matches;
      });
    }

    if (this.searchTerm().trim()) {
      const searchLower = this.searchTerm().toLowerCase();
      filtered = filtered.filter((holiday) => {
        const matches = holiday.vacationName
          .toLowerCase()
          .includes(searchLower);
        console.log(
          `Filter Search - Holiday: ${holiday.vacationName}, Search: ${searchLower}, Matches: ${matches}`
        );
        return matches;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.vacationDay);
      const dateB = new Date(b.vacationDay);
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }
      return dateA.getTime() - dateB.getTime();
    });

    this.filteredHolidays.set(filtered);
    console.log('Final Filtered Holidays:', filtered);
  }

  onYearFilterChange(value: number | string | undefined): void {
    this.yearFilter.set(value ? Number(value) : undefined);
    this.applyFilters();
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applyFilters();
  }

  resetFilters(): void {
    this.yearFilter.set(undefined);
    this.searchTerm.set('');
    this.applyFilters();
  }

  openAddModal(): void {
    this.newHoliday = this.getEmptyHoliday();
    this.nameError.set(null);
    this.dateError.set(null);
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
    this.nameError.set(null);
    this.dateError.set(null);
  }

  openEditModal(holiday: Holiday): void {
    this.selectedHoliday.set({ ...holiday });
    this.nameError.set(null);
    this.dateError.set(null);
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.nameError.set(null);
    this.dateError.set(null);
    this.selectedHoliday.set(null);
  }

  openDeleteModal(holiday: Holiday): void {
    this.selectedHoliday.set(holiday);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedHoliday.set(null);
  }

  validateHoliday(holiday: Holiday): boolean {
    let isValid = true;

    if (!holiday.vacationName || holiday.vacationName.trim().length < 3) {
      this.nameError.set('اسم العطلة يجب أن يكون ٣ أحرف على الأقل');
      isValid = false;
    } else {
      this.nameError.set(null);
    }

    const date = new Date(holiday.vacationDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!holiday.vacationDay || isNaN(date.getTime())) {
      this.dateError.set('يرجى إدخال تاريخ صالح');
      isValid = false;
    } else if (date < today) {
      this.dateError.set('التاريخ يجب أن يكون في المستقبل');
      isValid = false;
    } else {
      this.dateError.set(null);
    }

    return isValid;
  }

  async addHoliday(): Promise<void> {
    if (!this.validateHoliday(this.newHoliday)) {
      return;
    }
    try {
      const holidayToAdd = {
        vacationName: this.newHoliday.vacationName,
        vacationDay: this.newHoliday.vacationDay,
      };
      await this.employeeService.addOfficialHoliday(holidayToAdd);
      this.showNotification({
        message: 'تمت إضافة العطلة بنجاح',
        type: 'success',
      });
      this.closeAddModal();
      this.loadHolidays();
    } catch (err) {
      console.error('Failed to add holiday:', err);
      this.showNotification({ message: 'فشل في إضافة العطلة', type: 'error' });
    }
  }

  async updateHoliday(): Promise<void> {
    const holiday = this.selectedHoliday();
    if (!holiday || !holiday.id) return;
    if (!this.validateHoliday(holiday)) {
      return;
    }
    try {
      const holidayToUpdate = {
        id: holiday.id,
        vacationName: holiday.vacationName,
        vacationDay: holiday.vacationDay,
      };
      await this.employeeService.updateOfficialHoliday(holidayToUpdate);
      this.showNotification({
        message: 'تم تحديث العطلة بنجاح',
        type: 'success',
      });
      this.closeEditModal();
      this.loadHolidays();
    } catch (err) {
      console.error('Failed to update holiday:', err);
      this.showNotification({ message: 'فشل في تحديث العطلة', type: 'error' });
    }
  }

  async deleteHoliday(): Promise<void> {
    const holiday = this.selectedHoliday();
    if (!holiday || !holiday.id) return;
    try {
      await this.employeeService.deleteOfficialHoliday(holiday.id);
      this.showNotification({
        message: 'تم حذف العطلة بنجاح',
        type: 'success',
      });
      this.closeDeleteModal();
      this.loadHolidays();
    } catch (err) {
      console.error('Failed to delete holiday:', err);
      this.showNotification({ message: 'فشل في حذف العطلة', type: 'error' });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'تاريخ غير صالح';
    }
    return date.toLocaleDateString('ar', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getEmptyHoliday(): Holiday {
    return {
      id: '',
      vacationName: '',
      vacationDay: '',
    };
  }

  getYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }

  private showNotification(notification: Notification): void {
    this.notification.set(notification);
    setTimeout(() => this.notification.set(null), 3000);
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
}
