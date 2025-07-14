import { Component } from '@angular/core';
import { TopNavComponent } from '../../components/UserComponents/top-nav/top-nav.component';
import { AttendanceTrackerComponent } from '../../components/UserComponents/attendance-tracker/attendance-tracker.component';
import { EmployeeSalaryDetailsComponent } from '../../components/AdminComponents/Salary/employee-salary-details/employee-salary-details.component';
import { EmployeeDetailsComponent } from '../../components/AdminComponents/Employees/employee-details/employee-details.component';
// import { AbsenceReportComponent } from '../../components/UserComponents/absence-report/absence-report.component';
import { AbsenceReportComponent } from '../../components/AdminComponents/AttantanceReports/absence-report/absence-report.component';
import { UserProfileComponent } from "../../components/UserComponents/user-profile/user-profile.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-userdashboard',
  imports: [TopNavComponent, RouterModule],
  templateUrl: './userdashboard.component.html',
  styleUrl: './userdashboard.component.scss',
})
export class UserdashboardComponent {}
