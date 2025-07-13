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
import { AddEmployeeComponent } from './components/add-employee/add-employee.component';
import { EmployeeDetailsComponent } from './components/employee-details/employee-details.component';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { EditEmployeeComponent } from './components/edit-employee/edit-employee.component';
import { HolidaysComponent } from './components/holidays/holidays.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { EmployeeShiftsComponent } from './components/employee-shifts/employee-shifts.component';
import { BranchesComponent } from './components/branches/branches.component';
import { UserRolesComponent } from './components/Roles/Roles.component';
import { AttendanceTrackerComponent } from './components/UserComponents/attendance-tracker/attendance-tracker.component';
import { GeneralSettingsComponent } from './components/general-settings/general-settings.component';
import { AttendanceReportsComponent } from './components/attendance-reports/attendance-reports.component';
import { EmployeeSalariesComponent } from './components/employee-salaries/employee-salaries.component';
import { NotificationsComponent } from './components/notification/notification.component';
import { EmployeeSalaryDetailsComponent } from './components/employee-salary-details/employee-salary-details.component';
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
        path: 'userDashboard',
        component: UserdashboardComponent,
        canActivate: [RoleGuard],
        data: { roles: ['User', 'Admin'] },
        children: [
          { path: 'vacations', component: EmployeeVacationsComponent },

          { path: 'absence', component: AbsenceReportComponent },
          { path: '', redirectTo: 'userDashboard', pathMatch: 'full' },
          // { path: 'dashboard', component: AdminDashboardComponent },
        ],
      },
      { path: 'absence', component: AbsenceReportComponent },

      { path: 'vacations', component: EmployeeVacationsComponent },
      { path: 'profile', component: UserProfileComponent },
      { path: 'salary', component: SalaryDetailsComponent },
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
