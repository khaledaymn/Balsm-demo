import { Component } from '@angular/core';
import { TopNavComponent } from '../../components/top-nav/top-nav.component';
import { AttendanceTrackerComponent } from '../../components/attendance-tracker/attendance-tracker.component';

@Component({
  selector: 'app-userdashboard',
  imports: [TopNavComponent, AttendanceTrackerComponent],
  templateUrl: './userdashboard.component.html',
  styleUrl: './userdashboard.component.scss',
})
export class UserdashboardComponent {}
