import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../../../core/services/employee.service';
import { editEmployee, Employee } from '../../../../models/employee.model';
import { Branch } from '../../../../models/branch.model';
import { BranchService } from '../../../../core/services/branches.service';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-edit-employee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-employee.component.html',
  styleUrls: ['./edit-employee.component.scss'],
})
export class EditEmployeeComponent implements OnInit {
  editEmployee: editEmployee | null = null;
  notification: Notification | null = null;
  errorMessage: string | null = null;
  branches: Branch[] = [];
  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private branchService: BranchService,
    private router: Router
  ) {
    console.log('EditEmployeeComponent constructor called');
  }
  ngOnInit(): void {
    this.loadBranches();
    const id = this.route.snapshot.paramMap.get('id');
    console.log(id);
    if (id) {
      this.loadEmployee(id);
      console.log(id + ' ,,,,,,,,,,,id loadEmployee');
    } else {
      this.errorMessage = 'لم يتم العثور على معرف الموظف';
    }
  }
  loadBranches(): void {
    this.branchService.getAllBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load branches. Please try again later.';
        console.error('Error fetching branches:', error);
      },
    });
  }
  private loadEmployee(id: string): any {
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        const employee = response.data;
        this.editEmployee = {
          id: employee.id || '',
          name: employee.name || '',
          email: employee.email || '',
          phoneNumber: employee.phoneNumber || '',
          address: employee.address || '',
          gender: employee.gender || 'male',
          salary: employee.salary ?? 0,
          branchId: employee.branch.id || 0,
          hiringDate: employee.hiringDate || '',
          nationalId: employee.nationalId || '',
          dateOfBarth: employee.dateOfBarth || '',
        };
        console.log(this.editEmployee + ' loadEmployee');
        return this.editEmployee;
      },
      error: (err) => {
        console.error('Failed to load employee:', err);
        this.errorMessage = 'فشل في تحميل بيانات الموظف. حاول مرة أخرى.';
      },
    });
  }

  saveeditEmployee(): void {
    if (this.editEmployee) {
      this.employeeService.updateEmployee(this.editEmployee).subscribe({
        next: () => {
          this.showNotification('تم تعديل الموظف بنجاح', 'success');
          setTimeout(() => {
            this.router.navigate(['/app/admin/employees']);
          }, 2000); // Navigate back after showing notification
        },
        error: (err) => {
          console.error('Failed to update employee:', err);
          this.showNotification('فشل في تعديل الموظف', 'error');
        },
      });
    }
  }

  cancelEdit(): void {
    this.router.navigate(['/app/admin/employees']);
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 3000);
  }
}
