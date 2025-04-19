import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { BranchService } from '../../core/services/branches.service';
import { addEmployee } from '../../models/employee.model';
import { Branch } from '../../models/branch.model';
import { firstValueFrom } from 'rxjs';

interface AppNotification {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.scss'],
})
export class AddEmployeeComponent implements OnInit {
  @Output() employeeAdded = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  branches: Branch[] = [];
  errorMessage: string | null = null;
  isLoadingBranches = false;
  newEmployee: addEmployee = {
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    nationalId: '',
    baseSalary: 0,
    password: 'P@ssword123',
    gender: 'male',
    hiringDate: '',
    dateOfBarth: '',
    roles: ['User'],
    branchId: 0,
  };

  notification: AppNotification | null = null;
  submitted = false;
  isNameUnique = true;
  isEmailUnique = true;

  constructor(
    private employeeService: EmployeeService,
    private branchService: BranchService
  ) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.isLoadingBranches = true;
    this.branchService.getAllBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
        this.isLoadingBranches = false;
      },
      error: (error) => {
        this.errorMessage = 'فشل تحميل الفروع. حاول مرة أخرى.';
        this.isLoadingBranches = false;
        console.error('Error fetching branches:', error);
      },
    });
  }

  async addEmployee(): Promise<void> {
    this.submitted = true;

    // Reset uniqueness flags
    this.isNameUnique = true;
    this.isEmailUnique = true;

    // Validate form
    if (!this.isValidForm()) {
      this.showNotification('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
      return;
    }

    try {
      // Client-side uniqueness checks
      const isNameUnique = await firstValueFrom(this.employeeService.isNameUnique(this.newEmployee.name));
      this.isNameUnique = isNameUnique ?? false;
      if (!this.isNameUnique) {
        this.showNotification('الاسم مستخدم بالفعل', 'error');
        return;
      }

      const isEmailUnique = await firstValueFrom(this.employeeService.isEmailUnique(this.newEmployee.email));
      this.isEmailUnique = isEmailUnique ?? false;
      if (!this.isEmailUnique) {
        this.showNotification('البريد الإلكتروني مستخدم بالفعل', 'error');
        return;
      }

      // Server-side uniqueness checks
      // const isNameUniqueServer = await firstValueFrom(this.employeeService.checkNameUniqueServer(this.newEmployee.name));
      // this.isNameUnique = isNameUniqueServer ?? false;
      // if (!this.isNameUnique) {
      //   this.showNotification('الاسم مستخدم بالفعل', 'error');
      //   return;
      // }

      // const isEmailUniqueServer = await firstValueFrom(this.employeeService.checkEmailUniqueServer(this.newEmployee.email));
      // this.isEmailUnique = isEmailUniqueServer ?? false;
      // if (!this.isEmailUnique) {
      //   this.showNotification('البريد الإلكتروني مستخدم بالفعل', 'error');
      //   return;
      // }

      // Proceed with adding employee
      this.employeeService.addEmployee(this.newEmployee).subscribe({
        next: (response) => {
          this.showNotification('تم إضافة الموظف بنجاح', 'success');
          this.employeeAdded.emit();
          this.resetForm();
        },
        error: (err) => {
          this.showNotification('فشل في إضافة الموظف', 'error');
          console.error('Failed to add employee:', err);
        },
      });
    } catch (err) {
      this.showNotification(
        'فشل في التحقق من الاسم أو البريد الإلكتروني',
        'error'
      );
      console.error('Uniqueness check failed:', err);
    }
  }

  cancelAdd(): void {
    this.cancel.emit();
    this.resetForm();
  }

  // Validation functions
  isEmailValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.newEmployee.email);
  }

  isPhoneNumberValid(): boolean {
    const phoneRegex = /^\+\d{10,14}$/;
    return phoneRegex.test(this.newEmployee.phoneNumber);
  }

  isAddressValid(): boolean {
    return this.newEmployee.address.length >= 3;
  }

  isNationalIdValid(): boolean {
    const nationalIdRegex = /^\d{14}$/;
    return nationalIdRegex.test(this.newEmployee.nationalId);
  }

  isPasswordValid(): boolean {
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(this.newEmployee.password);
  }

  isDateOfBarthValid(): boolean {
    if (!this.newEmployee.dateOfBarth) return false;
    const BarthDate = new Date(this.newEmployee.dateOfBarth);
    const minDate = new Date('1900-01-01');
    return (
      BarthDate >= minDate &&
      BarthDate <= new Date() &&
      !isNaN(BarthDate.getTime())
    );
  }

  isDateOrderValid(): boolean {
    if (!this.newEmployee.dateOfBarth || !this.newEmployee.hiringDate) {
      return false;
    }
    const BarthDate = new Date(this.newEmployee.dateOfBarth);
    const hiringDate = new Date(this.newEmployee.hiringDate);
    return (
      BarthDate < hiringDate &&
      !isNaN(BarthDate.getTime()) &&
      !isNaN(hiringDate.getTime())
    );
  }

  isBranchValid(): boolean {
    return (
      this.newEmployee.branchId > 0 &&
      this.branches.some((b) => b.id === this.newEmployee.branchId)
    );
  }

  private isValidForm(): boolean {
    return (
      !!this.newEmployee.name &&
      this.isEmailValid() &&
      this.isPhoneNumberValid() &&
      this.isAddressValid() &&
      this.isNationalIdValid() &&
      this.newEmployee.baseSalary > 0 &&
      this.isPasswordValid() &&
      ['male', 'female'].includes(this.newEmployee.gender) &&
      this.isDateOfBarthValid() &&
      !!this.newEmployee.hiringDate &&
      this.isDateOrderValid() &&
      this.isBranchValid()
    );
  }

  private resetForm(): void {
    this.newEmployee = {
      name: '',
      email: '',
      phoneNumber: '',
      address: '',
      nationalId: '',
      baseSalary: 0,
      password: 'P@ssword123',
      gender: 'male',
      hiringDate: '',
      dateOfBarth: '',
      roles: ['User'],
      branchId: 0,
    };
    this.submitted = false;
    this.notification = null;
    this.isNameUnique = true;
    this.isEmailUnique = true;
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 3000);
  }

  onBranchChange(branchId: number): void {
    console.log('Selected Branch ID:', branchId);
  }

  getbranchId() {
    return this.newEmployee.branchId;
  }
}
