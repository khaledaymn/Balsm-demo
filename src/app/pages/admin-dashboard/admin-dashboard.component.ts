import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from '../../components/AdminComponents/admin-sidebar/admin-sidebar.component';
import { DashboardStatsComponent } from '../../components/dashboard-stats/dashboard-stats.component';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent {}
