import { Routes } from '@angular/router';
// import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';
// import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';
// import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EmployeesComponent } from './pages/employees/employees.component';
import { LeaveComponent } from './pages/leave/leave.component';
import { PayrollComponent } from './pages/payroll/payroll.component';
import { RecruitmentComponent } from './pages/recruitment/recruitment.component';
import { LoginComponent } from './pages/login/login.component';
import { ContactAdminComponent } from './pages/contact-admin/contact-admin.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

export const appRoutes: Routes = [
  {
    path: '',
    // component: MainLayoutComponent,
    // canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardComponent },
      {
        path: 'employees',
        component: EmployeesComponent,
        canActivate: [RoleGuard],
        data: { role: 'admin' },
      },
      { path: 'leave', component: LeaveComponent },
      {
        path: 'payroll',
        component: PayrollComponent,
        canActivate: [RoleGuard],
        data: { role: 'admin' },
      },
      {
        path: 'recruitment',
        component: RecruitmentComponent,
        canActivate: [RoleGuard],
        data: { role: 'admin' },
      },
    ],
  },
  {
    path: 'auth',
    // component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'contact-admin', component: ContactAdminComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent }, // New route
      { path: 'reset-password', component: ResetPasswordComponent }, // New route
    ],
  },
  { path: '**', redirectTo: '/auth/login' },
];
