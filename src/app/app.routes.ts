import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { AdminLayoutComponent } from './pages/admin-layout/admin-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { ContactAdminComponent } from './pages/contact-admin/contact-admin.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { RoleSelectComponent } from './pages/role-select/role-select.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { UserdashboardComponent } from './pages/userdashboard/userdashboard.component';
import { AddEmployeeComponent } from './components/AdminComponents/Employees/add-employee/add-employee.component';
import { EmployeeDetailsComponent } from './components/AdminComponents/Employees/employee-details/employee-details.component';
import { EmployeeListComponent } from './components/AdminComponents/Employees/employee-list/employee-list.component';
import { EditEmployeeComponent } from './components/AdminComponents/Employees/edit-employee/edit-employee.component';
import { HolidaysComponent } from './components/AdminComponents/holidays/holidays.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { EmployeeShiftsComponent } from './components/AdminComponents/general-settings/employee-shifts/employee-shifts.component';
import { BranchesComponent } from './components/AdminComponents/branches/branches.component';
import { UserRolesComponent } from './components/AdminComponents/Roles/Roles.component';
import { AttendanceTrackerComponent } from './components/UserComponents/attendance-tracker/attendance-tracker.component';
import { GeneralSettingsComponent } from './components/AdminComponents/general-settings/general-settings.component';
import { AttendanceReportsComponent } from './components/AdminComponents/AttantanceReports/attendance-reports/attendance-reports.component';
import { EmployeeSalariesComponent } from './components/AdminComponents/Salary/employee-salaries/employee-salaries.component';
import { NotificationsComponent } from './components/AdminComponents/notification/notification.component';
import { EmployeeSalaryDetailsComponent } from './components/AdminComponents/Salary/employee-salary-details/employee-salary-details.component';
import { AbsenceReportComponent } from './components/UserComponents/absence-report/absence-report.component';
import { EmployeeVacationsComponent } from './components/UserComponents/employee-vacations/employee-vacations.component';
import { UserProfileComponent } from './components/UserComponents/user-profile/user-profile.component';
import { SalaryDetailsComponent } from './components/UserComponents/salary-details/salary-details.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'contact-admin', component: ContactAdminComponent },
    ],
  },

  {
    path: 'app',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Admin'] },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: AdminDashboardComponent },
          { path: 'employees', component: EmployeeListComponent },
          { path: 'add-employee', component: AddEmployeeComponent },
          { path: 'edit-employee/:id', component: EditEmployeeComponent },
          { path: 'employee-details/:id', component: EmployeeDetailsComponent },
          { path: 'holidays', component: HolidaysComponent },
          { path: 'shifts', component: EmployeeShiftsComponent },
          { path: 'branches', component: BranchesComponent }, // Placeholder for branches component
          { path: 'user-roles', component: UserRolesComponent }, // Placeholder for branches component
          {
            path: 'employee-salary',
            component: EmployeeSalariesComponent,
          },
          {
            path: 'employee-salary-details/:id',
            component: EmployeeSalaryDetailsComponent,
          },
          {
            path: 'attendance-tracker',
            component: AttendanceTrackerComponent,
          },
          {
            path: 'settings',
            component: GeneralSettingsComponent,
          },
          { path: 'attendance/reports', component: AttendanceReportsComponent },
          { path: 'notification', component: NotificationsComponent },

          { path: 'payroll/list', component: EmployeeSalariesComponent },
        ],
      },

      {
        path: 'user',
        component: UserdashboardComponent,
        canActivate: [RoleGuard],
        data: { roles: ['User', 'Admin'] },
        children: [
          {path: '', redirectTo: '/app/user/attendance-tracker', pathMatch:'full'},
          { path: 'vacations', component: EmployeeVacationsComponent },
          { path: 'absence', component: AbsenceReportComponent },
          { path: 'vacations', component: EmployeeVacationsComponent },
          { path: 'profile', component: UserProfileComponent },
          { path: 'salary', component: SalaryDetailsComponent },
          { path: 'attendance-tracker', component: AttendanceTrackerComponent },
        ],
      },
      {
        path: 'role-select',
        component: RoleSelectComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Admin', 'User'] },
      },
    ],
  },

  { path: '**', redirectTo: '/auth/login' },
];
