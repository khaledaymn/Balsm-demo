import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Stat {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  change: number;
}

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-stats.component.html',
  styleUrls: ['./dashboard-stats.component.scss'],
})
export class DashboardStatsComponent implements OnInit {
  stats: Stat[] = [
    {
      title: 'إجمالي الموظفين',
      value: 150,
      change: 12,
      icon: 'people',
      color: '#4CAF50',
    },
    {
      title: 'الحضور اليوم',
      value: 142,
      change: -3,
      icon: 'check_circle',
      color: '#2196F3',
    },
    {
      title: 'الإجازات النشطة',
      value: 8,
      change: 2,
      icon: 'event_busy',
      color: '#FF9800',
    },
    {
      title: 'طلبات قيد الانتظار',
      value: 15,
      change: 5,
      icon: 'pending_actions',
      color: '#F44336',
    },
  ];

  constructor() {}

  ngOnInit(): void {
    // Simulate fetching data from a service
    this.loadStats();
  }

  private loadStats(): void {
    // Replace with actual API call if needed, e.g.:
    // this.statsService.getStats().subscribe((data) => this.stats = data);
  }
}
