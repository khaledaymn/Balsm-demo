import { Component } from '@angular/core';
import { TopNavComponent } from '../../components/top-nav/top-nav.component';
import { AttendanceTrackerComponent } from '../../components/attendance-tracker/attendance-tracker.component';
import { EmployeeSalaryDetailsComponent } from '../../components/employee-salary-details/employee-salary-details.component';
import { EmployeeDetailsComponent } from '../../components/employee-details/employee-details.component';

@Component({
  selector: 'app-userdashboard',
  imports: [
    TopNavComponent,
    AttendanceTrackerComponent,
    EmployeeSalaryDetailsComponent,
    EmployeeDetailsComponent,
  ],
  templateUrl: './userdashboard.component.html',
  styleUrl: './userdashboard.component.scss',
})
export class UserdashboardComponent {}
