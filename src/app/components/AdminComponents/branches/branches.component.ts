import { Component, type OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchService } from '../../../core/services/branches.service';
import { Branch } from '../../../models/branch.model';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './branches.component.html',
  styleUrls: ['./branches.component.scss'],
})
export class BranchesComponent implements OnInit {
  // Signals for state management
  branches = signal<Branch[]>([]);
  filteredBranches = signal<Branch[]>([]);
  selectedBranch = signal<Branch | null>(null);
  notification = signal<Notification | null>(null);
  isLoading = signal<boolean>(false);

  // Modal state signals
  isAddModalOpen = signal<boolean>(false);
  isEditModalOpen = signal<boolean>(false);
  isDeleteModalOpen = signal<boolean>(false);
  isDetailsModalOpen = signal<boolean>(false);

  // Filter signals
  searchTerm = signal<string>('');

  // New branch object for the add form
  newBranch: Branch = {
    id: 0,
    name: '',
    latitude: 0,
    longitude: 0,
    radius: 0,
  };

  constructor(private branchService: BranchService) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.isLoading.set(true);
    this.branchService.getAllBranches().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.showNotification({
          message: 'فشل في تحميل الفروع. حاول مرة أخرى.',
          type: 'error',
        });
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.branches()];

    // Apply search term
    if (this.searchTerm().trim()) {
      const searchLower = this.searchTerm().toLowerCase();
      filtered = filtered.filter((branch) =>
        branch.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    this.filteredBranches.set(filtered);
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.applyFilters();
  }

  // Modal management
  openAddModal(): void {
    this.resetNewBranch();
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  openEditModal(branch: Branch): void {
    this.selectedBranch.set({ ...branch });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedBranch.set(null);
  }

  openDeleteModal(branch: Branch): void {
    this.selectedBranch.set(branch);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedBranch.set(null);
  }

  openDetailsModal(branch: Branch): void {
    this.selectedBranch.set(branch);
    this.isDetailsModalOpen.set(true);
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen.set(false);
    this.selectedBranch.set(null);
  }

  // CRUD operations
  addBranch(): void {
    if (!this.validateBranch(this.newBranch)) {
      return;
    }

    // Remove id from newBranch as the backend should generate it
    const branchToAdd: Branch = {
      ...this.newBranch,
      id: 0, // Backend will assign the ID
    };

    this.branchService.addBranch(branchToAdd).subscribe({
      next: (newBranch) => {
        // Add the new branch to the list
        this.branches.update((branches) => [...branches, newBranch]);
        this.applyFilters();
        this.closeAddModal();
        this.showNotification({
          message: 'تمت إضافة الفرع بنجاح',
          type: 'success',
        });
        this.loadBranches();
      },
      error: (err) => {
        this.showNotification({
          message: 'فشل في إضافة الفرع. حاول مرة أخرى.',
          type: 'error',
        });
      },
    });
  }

  updateBranch(): void {
    const branch = this.selectedBranch();
    if (!branch || !this.validateBranch(branch)) {
      return;
    }

    this.branchService.updateBranch(branch).subscribe({
      next: (updatedBranch) => {
        // Update the branch in the list
        this.branches.update((branches) =>
          branches.map((b) => (b.id === updatedBranch.id ? updatedBranch : b))
        );
        this.applyFilters();
        this.closeEditModal();
        this.showNotification({
          message: 'تم تحديث الفرع بنجاح',
          type: 'success',
        });
        this.loadBranches();
      },
      error: (err) => {
        this.showNotification({
          message: 'فشل في تحديث الفرع. حاول مرة أخرى.',
          type: 'error',
        });
      },
    });
  }

  deleteBranch(): void {
    const branch = this.selectedBranch();
    if (!branch) return;

    this.branchService.deleteBranch(branch.id).subscribe({
      next: () => {
        // Remove the branch from the list
        this.branches.update((branches) =>
          branches.filter((b) => b.id !== branch.id)
        );
        this.applyFilters();
        this.closeDeleteModal();
        this.showNotification({
          message: 'تم حذف الفرع بنجاح',
          type: 'success',
        });
        this.loadBranches();
      },
      error: (err) => {
        this.showNotification({
          message: 'فشل في حذف الفرع. حاول مرة أخرى.',
          type: 'error',
        });
      },
    });
  }

  // Helper methods
  resetNewBranch(): void {
    this.newBranch = {
      id: 0,
      name: '',
      latitude: 0,
      longitude: 0,
      radius: 0,
    };
  }

  validateBranch(branch: Branch): boolean {
    if (!branch.name.trim()) {
      this.showNotification({
        message: 'اسم الفرع مطلوب',
        type: 'error',
      });
      return false;
    }

    if (branch.latitude === 0 && branch.longitude === 0) {
      this.showNotification({
        message: 'موقع الفرع مطلوب',
        type: 'error',
      });
      return false;
    }

    if (branch.radius <= 0) {
      this.showNotification({
        message: 'نطاق الفرع يجب أن يكون أكبر من صفر',
        type: 'error',
      });
      return false;
    }

    return true;
  }

  private showNotification(notification: Notification): void {
    this.notification.set(notification);
    setTimeout(() => {
      this.notification.set(null);
    }, 3000);
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

  formatLocation(latitude: number, longitude: number): string {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}
