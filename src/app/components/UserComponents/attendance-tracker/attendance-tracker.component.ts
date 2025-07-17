import { Component, OnInit } from '@angular/core';
import { Attendance, Leave } from '../../../models/attendance.model';
import { AttendanceOperationsService } from '../../../core/services/Attendance/attendance-operations.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeValidationService } from '../../../core/services/Attendance/time-validation.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Shift } from '../../../models/shifts.model';
import { AttendanceService } from '../../../core/services/Attendance/attendance.service';
import { LocationService } from '../../../core/services/Attendance/location.service';
import { Router } from '@angular/router';
import { interval } from 'rxjs';

@Component({
  selector: 'app-attendance-tracker',
  templateUrl: './attendance-tracker.component.html',
  styleUrls: ['./attendance-tracker.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class AttendanceTrackerComponent implements OnInit {
  userId: string | null = null;
  attendanceRecords: Attendance[] = [];
  leaveRecords: Leave[] = [];
  message: string | null = null;
  error: string | null = null;
  isLoading: boolean = false;
  today: Date = new Date();

  constructor(
    private route: Router,
    private attendanceService: AttendanceOperationsService,
    private a: AttendanceService,
    private authService: AuthService,
    private timeValidationService: TimeValidationService,
    private locationService: LocationService
  ) {
    interval(60000).subscribe(() => {
      // this.route.navigate(['/app/user/test']);
    });
  }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (this.userId) {
      this.loadAttendanceRecords();
    }
    console.log(this.locationService.getCurrentLocation());
  }

  private loadAttendanceRecords(): void {
    this.isLoading = true;
    this.a.getAttendanceRecords(this.userId!).subscribe({
      next: (records) => {
        this.attendanceRecords = records;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = this.translateError(error.message);
        this.isLoading = false;
        this.clearMessageAfterDelay();
      },
    });

    // this.attendanceService.getLeaveRecords(this.userId!).subscribe({
    //   next: (records) => {
    //     this.leaveRecords = records;
    //     this.isLoading = false;
    //   },
    //   error: (error) => {
    //     this.error = this.translateError(error.message);
    //     this.isLoading = false;
    //     this.clearMessageAfterDelay();
    //   },
    // });
  }

  checkIn(): void {
    if (!this.userId) {
      this.error = 'المستخدم غير مصادق عليه';
      this.clearMessageAfterDelay();
      return;
    }

    const currentShift = this.getCurrentShift();
    if (!currentShift) {
      this.error = 'لم يتم العثور على وردية نشطة';
      this.clearMessageAfterDelay();
      return;
    }
    console.log('currentShift' + currentShift?.id);
    if (this.hasActiveCheckIn(currentShift)) {
      this.error = 'تم تسجيل الحضور لهذه الوردية بالفعل';
      this.clearMessageAfterDelay();
      return;
    }

    this.isLoading = true;
    const localTime: Date = new Date();
    console.log(localTime);

    this.attendanceService.checkIn(this.userId,localTime).subscribe({
      next: (record) => {
        this.attendanceRecords = [...this.attendanceRecords, record];
        this.message = 'تم تسجيل الحضور بنجاح';
        console.log(currentShift + 'currentShift');
        this.error = null;
        this.isLoading = false;
        this.clearMessageAfterDelay();
      },
      error: (error) => {
        this.error = this.translateError(error.message);
        this.message = null;
        this.isLoading = false;
        this.clearMessageAfterDelay();
      },
    });
  }

  checkOut(): void {
    if (!this.userId) {
      this.error = 'المستخدم غير مصادق عليه';
      this.clearMessageAfterDelay();
      return;
    }

    const currentShift = this.getCurrentShift();
    if (!currentShift) {
      this.error = 'لم يتم العثور على وردية نشطة';
      this.clearMessageAfterDelay();
      return;
    }

    if (!this.hasActiveCheckIn(currentShift)) {
      this.error = 'لا يمكن تسجيل الانصراف بدون تسجيل حضور أولاً';
      this.clearMessageAfterDelay();
      return;
    }

    const now = new Date();
    if (!this.timeValidationService.isShiftTimeEnd(now, currentShift)) {
      this.error = 'لا يمكن تسجيل الانصراف قبل انتهاء الوردية';
      this.clearMessageAfterDelay();
      return;
    }

    this.isLoading = true;
    this.attendanceService.checkOut(this.userId, now).subscribe({
      next: (record) => {
        this.leaveRecords = [...this.leaveRecords, record];
        this.message = 'تم تسجيل الانصراف بنجاح';
        this.error = null;
        this.isLoading = false;
        this.clearMessageAfterDelay();
      },
      error: (error) => {
        this.error = this.translateError(error.message);
        this.message = null;
        this.isLoading = false;
        this.clearMessageAfterDelay();
      },
    });
  }
  hasActiveCheckIn(shift: Shift | null): boolean {
    const shiftAttendance = this.attendanceRecords.filter(
      (record) => record.shiftId === shift?.id
    );
    if (shiftAttendance.length === 0) {
      return false;
    }
    return !shiftAttendance.some((attendance) =>
      this.leaveRecords.some(
        (leave) =>
          leave.employeeId === attendance.employeeId &&
          leave.shiftId === attendance.shiftId
      )
    );
  }

  canCheckOut(): boolean {
    const currentShift = this.getCurrentShift();
    if (!currentShift) {
      return false;
    }
    return this.timeValidationService.isShiftTimeEnd(new Date(), currentShift);
  }

  public getCurrentShift(): Shift | null {
    const shifts = this.authService.getShifts();
    if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
      return null;
    }

    const validShifts = shifts.filter(
      (s): s is Shift => s !== null && s !== undefined
    );
    if (validShifts.length === 0) {
      return null;
    }

    const now = new Date();
    return this.attendanceService.findCurrentShift(validShifts, now) || null;
  }

  private translateError(errorMessage: string): string {
    const errorMap: { [key: string]: string } = {
      'Unauthorized: Invalid user ID': 'غير مصرح: معرف المستخدم غير صالح',
      'No shifts available': 'لا توجد ورديات متاحة',
      'No valid shifts available': 'لا توجد ورديات صالحة متاحة',
      'No active shift found for the current time':
        'لم يتم العثور على وردية نشطة للوقت الحالي',
      'No recently ended shift found for the current time':
        'لم يتم العثور على وردية انتهت مؤخرًا للوقت الحالي',
      'Employee is not at required branch': 'الموظف ليس في الفرع المطلوب',
      'Cannot check in. It is too soon after the previous shift ended.':
        'لا يمكن تسجيل الحضور. الوقت قريب جدًا من نهاية الوردية السابقة',
      'Client-side error': 'خطأ من جانب العميل',
      'Unauthorized: Please log in again.':
        'غير مصرح: يرجى تسجيل الدخول مرة أخرى',
      'Forbidden: You do not have permission to perform this action.':
        'ممنوع: ليس لديك إذن لتنفيذ هذا الإجراء',
      'Resource not found.': 'المورد غير موجود',
      'Server error: Please try again later.':
        'خطأ في الخادم: يرجى المحاولة مرة أخرى لاحقًا',
      'أنت خارج موقع العمل المسموح': 'أنت خارج موقع العمل المسموح',
      'Attendance already recorded for this shift':
        'تم تسجيل الحضور لهذه الوردية بالفعل',
      'No active check-in found for this shift':
        'لا يوجد تسجيل حضور نشط لهذه الوردية',
    };
    return errorMap[errorMessage] || `فشل العملية: ${errorMessage}`;
  }

  private clearMessageAfterDelay(): void {
    setTimeout(() => {
      this.message = null;
      this.error = null;
    }, 5000);
  }
}
