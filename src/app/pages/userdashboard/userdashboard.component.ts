import { Component } from '@angular/core';
import { TopNavComponent } from '../../components/UserComponents/top-nav/top-nav.component';
import { AttendanceTrackerComponent } from '../../components/UserComponents/attendance-tracker/attendance-tracker.component';
import { EmployeeSalaryDetailsComponent } from '../../components/employee-salary-details/employee-salary-details.component';
import { EmployeeDetailsComponent } from '../../components/employee-details/employee-details.component';
// import { AbsenceReportComponent } from '../../components/UserComponents/absence-report/absence-report.component';
import { AbsenceReportComponent } from '../../components/absence-report/absence-report.component';

@Component({
  selector: 'app-userdashboard',
  imports: [TopNavComponent, AttendanceTrackerComponent],
  templateUrl: './userdashboard.component.html',
  styleUrl: './userdashboard.component.scss',
})
export class UserdashboardComponent {}
