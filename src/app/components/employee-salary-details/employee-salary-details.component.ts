import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { Observable } from 'rxjs';
import { SalaryService } from '../../core/services/salary.service';

interface SalaryDetails {
  employeeName: string;
  baseSalary: number;
  overTime: number;
  overTimeSalary: number;
  lateTime: number;
  lateTimeSalary: number;
  numberOfAbsentDays: number;
  absentDaysSalary: number;
  totalSalary: number;
  month: number;
  year: number;
}

@Component({
  selector: 'app-employee-salary-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-salary-details.component.html',
  styleUrls: ['./employee-salary-details.component.scss'],
})
export class EmployeeSalaryDetailsComponent implements OnInit {
  salaryDetails: SalaryDetails | null = null;
  errorMessage: string | null = null;
  month: number = new Date().getMonth() + 1;
  year: number = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private salaryService: SalaryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const monthParam = this.route.snapshot.queryParamMap.get('month');
    const yearParam = this.route.snapshot.queryParamMap.get('year');

    if (monthParam) this.month = +monthParam;
    if (yearParam) this.year = +yearParam;

    if (id) {
      this.loadSalaryDetails(id, this.month, this.year);
    } else {
      this.errorMessage = 'لم يتم العثور على معرف الموظف';
    }
  }

  private loadSalaryDetails(id: string, month: number, year: number): void {
    this.salaryService.getEmployeeSalaryDetails(id, month, year).subscribe({
      next: (response) => {
        this.salaryDetails = {
          employeeName: response.employeeName || '',
          baseSalary: response.baseSalary || 0,
          overTime: response.overTime || 0,
          overTimeSalary: response.overTimeSalary || 0,
          lateTime: response.lateTime || 0,
          lateTimeSalary: response.lateTimeSalary || 0,
          numberOfAbsentDays: response.numberOfAbsentDays || 0,
          absentDaysSalary: response.absentDaysSalary || 0,
          totalSalary: response.totalSalary || 0,
          month: response.month || month,
          year: response.year || year,
        };
      },
      error: (err) => {
        console.error('Failed to load salary details:', err);
        this.errorMessage = 'فشل في تحميل تفاصيل الراتب. حاول مرة أخرى.';
      },
    });
  }

  closeDetails(): void {
    this.router.navigate(['/app/admin/employee-salary']);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDetails();
    }
  }
}
