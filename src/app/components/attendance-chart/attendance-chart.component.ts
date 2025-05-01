// import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Chart } from 'chart.js/auto';
// import { AttendanceService } from '../../core/services/Attandance.service';
// // import { AttendanceService } from '../../core/services/attendance.service';

// @Component({
//   selector: 'app-attendance-chart',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './attendance-chart.component.html',
//   styleUrls: ['./attendance-chart.component.scss'],
// })
// export class AttendanceChartComponent implements AfterViewInit {
//   @ViewChild('attendanceChartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
//   chart: Chart | undefined;
//   isDataEmpty: boolean = false;
//   errorMessage: string | null = null;

//   constructor(private attendanceService: AttendanceService) {}

//   ngAfterViewInit(): void {
//     this.attendanceService.getAttendanceData().subscribe({
//       next: (data) => {
//         this.errorMessage = null; // Clear previous errors
//         this.isDataEmpty = this.checkIfDataEmpty(data);
//         this.createChart(data);
//       },
//       error: (err) => {
//         console.error('Failed to load attendance data:', err);
//         this.errorMessage = 'تعذر تحميل بيانات الحضور. الرجاء المحاولة لاحقًا.';
//         this.isDataEmpty = true; // Show fallback UI
//       },
//     });
//   }

//   private checkIfDataEmpty(data: {
//     labels: string[];
//     attendance: number[];
//     late: number[];
//   }): boolean {
//     const hasNoAttendance = data.attendance.every((value) => value === 0);
//     const hasNoLate = data.late.every((value) => value === 0);
//     return hasNoAttendance && hasNoLate;
//   }

//   private createChart(data: {
//     labels: string[];
//     attendance: number[];
//     late: number[];
//   }): void {
//     const canvas = this.canvasRef?.nativeElement;
//     if (!canvas) return;

//     this.chart = new Chart(canvas, {
//       type: 'line',
//       data: {
//         labels: data.labels,
//         datasets: [
//           {
//             label: 'الحضور',
//             data: data.attendance,
//             borderColor: '#4CAF50',
//             backgroundColor: 'rgba(76, 175, 80, 0.1)',
//             tension: 0.4,
//             fill: true,
//           },
//           {
//             label: 'التأخير',
//             data: data.late,
//             borderColor: '#F44336',
//             backgroundColor: 'rgba(244, 67, 54, 0.1)',
//             tension: 0.4,
//             fill: true,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         plugins: {
//           legend: {
//             position: 'top',
//             align: 'end',
//             labels: { usePointStyle: true, boxWidth: 8 },
//           },
//           title: {
//             display: true,
//             text: 'إحصائيات الحضور الأسبوعية',
//             align: 'start',
//             font: { size: 18 },
//             padding: { top: 10, bottom: 20 },
//           },
//         },
//         scales: {
//           y: {
//             beginAtZero: true,
//             position: 'right',
//             grid: { color: 'rgba(0, 0, 0, 0.1)' },
//           },
//           x: { grid: { display: false } },
//         },
//         layout: { padding: 10 },
//       },
//     });
//   }

//   ngOnDestroy(): void {
//     if (this.chart) this.chart.destroy();
//   }
// }
