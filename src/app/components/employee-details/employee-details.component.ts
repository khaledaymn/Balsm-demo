import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss'],
})
export class EmployeeDetailsComponent implements OnInit {
  employee: Employee | null = null;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
    } else {
      this.errorMessage = 'لم يتم العثور على معرف الموظف';
    }
  }

  private loadEmployee(id: string): void {
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        this.employee = {
          ...response.data,
          id: response.data.id || '',
          branch: response.data.branch || [],
          name: response.data.name || '',
          email: response.data.email || '',
          phoneNumber: response.data.phoneNumber || '',
          address: response.data.address || '',
          nationalId: response.data.nationalId || '',
          salary: response.data.salary ?? 0,
          shift: response.data.shift || [],
          hiringDate: response.data.hiringDate || '',
          gender: response.data.gender || '',
          dateOfBarth: response.data.dateOfBarth || '',
          roles: response.data.roles || [],
        };
      },
      error: (err) => {
        console.error('Failed to load employee:', err);
        this.errorMessage = 'فشل في تحميل تفاصيل الموظف. حاول مرة أخرى.';
      },
    });
  }

  closeDetails(): void {
    this.router.navigate(['/app/admin/employees']);
  }

  editEmployee(): void {
    if (this.employee?.id) {
      this.router.navigate(['/app/admin/edit-employee', this.employee.id]);
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDetails();
    }
  }
}
