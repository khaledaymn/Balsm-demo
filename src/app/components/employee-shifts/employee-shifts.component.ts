import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../models/employee.model';
import { ShiftsService } from '../../core/services/shifts.service';
import { Shift } from '../../models/shifts.model';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule], // Add FormsModule
  templateUrl: './employee-shifts.component.html',
  styleUrls: ['./employee-shifts.component.scss'],
})
export class EmployeeShiftsComponent {
  private shiftsService = inject(ShiftsService);
  employees: Employee[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  // Form state for adding shifts
  addingShiftForEmployeeId: string | null = null;
  newShiftStartTime: string = '';
  newShiftEndTime: string = '';

  // Delete confirmation state
  deletingShift: { employeeId: string; shift: Shift } | null = null;

  constructor() {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.shiftsService.getEmployeesWithShifts().subscribe({
      next: (response) => {
        if (response.success) {
          this.employees = response.data.map((emp) => ({
            ...emp,
            shift: emp.shift || [],
          }));
        } else {
          this.errorMessage = 'Failed to load employees. Please try again.';
          console.error('Failed to load employees:', response);
        }
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error loading employees.';
        console.error('Error loading employees:', err);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  getShiftClass(startTime: string): string {
    const time = startTime.trim();

    // Validate time format (HH:MM)
    if (!time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      return 'shift-split';
    }
    const hour = parseInt(time.split(':')[0], 10);

    if (hour >= 8 && hour < 14) {
      return 'shift-first';
    }
    else if (hour >= 14 && hour < 22) {
      return 'shift-second';
    }
    else if (hour >= 22 || hour < 8) {
      return 'shift-third';
    }
    return 'shift-split';
  }

  addShift(employeeId: string): void {
    if (
      !this.validateTime(this.newShiftStartTime) ||
      !this.validateTime(this.newShiftEndTime)
    ) {
      this.errorMessage = 'Invalid time format. Use HH:MM (e.g., 09:00).';
      return;
    }

    const newShift: Shift = {
      id: 0,
      startTime: this.newShiftStartTime,
      endTime: this.newShiftEndTime,
      employeeId,
    };

    this.isLoading = true;
    this.errorMessage = null;
    this.shiftsService.addShift(newShift).subscribe({
      next: (response) => {
        if (response.success) {
          const employee = this.employees.find((emp) => emp.id === employeeId);
          if (employee) {
            employee.shift = employee.shift || [];
            employee.shift.push(response.data);
          }
        } else {
          this.cancelAddShift(); // Reset form

          this.loadEmployees();
        }
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error adding shift.';
        console.error('Error adding shift:', err);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  deleteShift(employeeId: string, shiftId: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.shiftsService.deleteShift({ shiftId, employeeId }).subscribe({
      next: (response: string) => {
        if (response === 'Shift deleted successfully.') {
          const employee = this.employees.find((emp) => emp.id === employeeId);
          if (employee?.shift) {
            employee.shift = employee.shift.filter(
              (shift) => shift.id !== shiftId
            );
          }
          this.cancelDeleteShift(); // Reset delete state
        } else {
          this.loadEmployees();
          this.errorMessage = 'Unexpected response from server.';
        }
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error deleting shift.';
        console.error('Error deleting shift:', err);
        this.loadEmployees();
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  startAddShift(employeeId: string): void {
    this.addingShiftForEmployeeId = employeeId;
    this.newShiftStartTime = '';
    this.newShiftEndTime = '';
  }

  cancelAddShift(): void {
    this.addingShiftForEmployeeId = null;
    this.newShiftStartTime = '';
    this.newShiftEndTime = '';
  }

  startDeleteShift(employeeId: string, shift: Shift): void {
    this.deletingShift = { employeeId, shift };
  }

  cancelDeleteShift(): void {
    this.deletingShift = null;
  }

  confirmDeleteShift(): void {
    if (this.deletingShift && this.deletingShift.shift.id !== undefined) {
      this.deleteShift(
        this.deletingShift.employeeId,
        this.deletingShift.shift.id
      );
    }
  }

  refreshShifts(): void {
    this.loadEmployees();
  }

 

  private validateTime(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
