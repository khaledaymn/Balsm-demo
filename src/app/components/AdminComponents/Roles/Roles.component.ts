import { Component, OnInit, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { Employee } from '../../../models/employee.model';
import { catchError, of, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  templateUrl: './Roles.component.html',
  styleUrls: ['./Roles.component.scss'],
})
export class UserRolesComponent implements OnInit {
  // Signals for reactive state management
  isLoading = signal<boolean>(true);
  users = signal<Employee[]>([]);
  searchTerm = signal<string>('');
  roleFilter = signal<string>('');
  isEditRolesModalOpen = signal<boolean>(false);
  selectedUser = signal<Employee | null>(null);
  notification = signal<Notification | null>(null);
  selectedRoles = signal<string[]>([]);

  // Form for role selection
  roleForm = new FormGroup({
    roles: new FormControl<string[]>([]),
  });

  // Available roles (consistent with API)
  availableRoles: string[] = ['Admin', 'User'];

  // Computed signal for filtered users
  filteredUsers = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const role = this.roleFilter();

    return this.users().filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);
      const matchesRole = role ? user.roles.includes(role) : true;
      return matchesSearch && matchesRole;
    });
  });

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // Load all users
  private loadUsers(): void {
    this.isLoading.set(true);
    this.employeeService
      .getEmployees()
      .pipe(
        tap((response) => {
          this.users.set(response.data);
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error loading users:', error);
          this.showNotification('error', 'فشل في تحميل المستخدمين.');
          this.isLoading.set(false);
          return of({ success: false, message: 'Error', data: [] });
        })
      )
      .subscribe();
  }

  // Handle search input changes
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  // Handle role filter changes
  onRoleFilterChange(role: string): void {
    this.roleFilter.set(role);
  }

  // Reset filters
  resetFilters(): void {
    this.searchTerm.set('');
    this.roleFilter.set('');
  }

  // Open edit roles modal
  openEditRolesModal(user: Employee): void {
    this.selectedUser.set(user);
    this.selectedRoles.set([...user.roles]);
    this.roleForm.setValue({ roles: [...user.roles] });
    this.isEditRolesModalOpen.set(true);
  }

  // Close edit roles modal
  closeEditRolesModal(): void {
    this.isEditRolesModalOpen.set(false);
    this.selectedUser.set(null);
    this.selectedRoles.set([]);
    this.roleForm.reset();
  }

  // Toggle role selection
  toggleRole(role: string): void {
    const currentRoles = this.roleForm.value.roles || [];
    let updatedRoles: string[];
    if (currentRoles.includes(role)) {
      updatedRoles = currentRoles.filter((r) => r !== role);
    } else {
      updatedRoles = [...currentRoles, role];
    }
    this.roleForm.setValue({ roles: updatedRoles });
    this.selectedRoles.set(updatedRoles);
  }

  // Check if a role is selected
  hasRole(role: string): boolean {
    return this.selectedRoles().includes(role);
  }

  // Save updated roles
  saveUserRoles(): void {
    const user = this.selectedUser();
    const roles = this.roleForm.value.roles || [];
    if (!user) return;

    // Validate roles to ensure only 'Admin' or 'User' are included
    const validRoles = roles.filter((role) =>
      this.availableRoles.includes(role)
    );
    if (validRoles.length !== roles.length) {
      this.showNotification('error', 'أدوار غير صالحة تم اختيارها.');
      return;
    }

    this.isLoading.set(true);
    this.employeeService
      .addUserToRole({ userId: user.id, roleName: validRoles })
      .pipe(
        tap((response) => {
          if (response.success) {
            this.showNotification('success', 'تم تحديث الأدوار بنجاح.');
            // Update local user roles
            this.users.update((users) =>
              users.map((u) =>
                u.id === user.id ? { ...u, roles: validRoles } : u
              )
            );
            this.closeEditRolesModal();
          } else {
            this.showNotification(
              'error',
              response.message || 'فشل في تحديث الأدوار.'
            );
          }
          this.isLoading.set(false);
        }),
        catchError((error) => {
          console.error('Error updating roles:', error);
          this.showNotification('error', 'فشل في تحديث الأدوار.');
          this.isLoading.set(false);
          return of({ success: false, message: 'Error' });
        })
      )
      .subscribe();
  }

  // Get role display name
  getRoleDisplayName(role: string): string {
    return role === 'Admin' ? 'مدير النظام' : 'موظف';
  }

  // Get role badge class
  getRoleBadgeClass(role: string): string {
    return role === 'Admin' ? 'admin-badge' : 'user-badge';
  }

  // Get notification icon
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

  // Show notification
  private showNotification(
    type: 'success' | 'error' | 'info',
    message: string
  ): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 5000);
  }
}
