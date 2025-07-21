import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../core/services/auth.service';

interface Shift {
  id: number;
  startTime: string;
  endTime: string;
  employeeId?: string;
  hasAttendanceTaken: boolean;
  hasLeaveTaken: boolean;
}

interface Branch {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface AttendanceRequest {
  timeOfAttend: string;
  latitude: number;
  longitude: number;
  employeeId: string;
}

interface LeaveRequest {
  timeOfLeave: string;
  latitude: number;
  longitude: number;
  employeeId: string;
}

@Component({
  selector: 'app-attendance-leave',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="attendance-tracker">
      <div class="time-display">
        <h2 class="time">الوقت الحالي: {{ currentTime | date : 'HH:mm' }}</h2>
        <p class="date">التاريخ: {{ currentTime | date : 'yyyy-MM-dd' }}</p>
      </div>

      <div
        class="notification"
        [ngClass]="{
          success: statusMessageType === 'success',
          error: statusMessageType === 'error',
          warning: statusMessageType === 'warning',
          info: statusMessageType === 'info'
        }"
        *ngIf="statusMessage"
      >
        <span class="material-icons">
          {{
            statusMessageType === 'success'
              ? 'check_circle'
              : statusMessageType === 'error'
              ? 'error'
              : statusMessageType === 'warning'
              ? 'warning'
              : 'info'
          }}
        </span>
        <p>{{ statusMessage }}</p>
      </div>

      <div class="attendance-info" *ngIf="shifts.length > 0">
        <h2 class="status-label">الورديات</h2>
        <div *ngFor="let shift of shifts" class="status-checked-in">
          <p>
            <span class="status-label">الوردية :</span>
            <span class="status-time"
              >{{ shift.startTime }} - {{ shift.endTime }}</span
            >
          </p>
          <p>
            <span class="status-label">تسجيل الحضور:</span>
            <span class="status-time">{{
              shift.hasAttendanceTaken ? 'تم التسجيل' : 'لم يتم التسجيل'
            }}</span>
          </p>
          <p>
            <span class="status-label">تسجيل الانصراف:</span>
            <span class="status-time">{{
              shift.hasLeaveTaken ? 'تم التسجيل' : 'لم يتم التسجيل'
            }}</span>
          </p>
        </div>
      </div>

      <div class="actions">
        <button
          class="check-in-btn"
          [disabled]="!isAttendanceEnabled"
          (click)="onAttendanceClick()"
        >
          <span class="material-icons">login</span>
          تسجيل الحضور
        </button>
        <button
          class="check-out-btn"
          [disabled]="!isLeaveEnabled"
          (click)="onLeaveClick()"
        >
          <span class="material-icons">logout</span>
          تسجيل الانصراف
        </button>
      </div>

      <div class="notification success" *ngIf="actionMessage">
        <span class="material-icons">check_circle</span>
        <p>{{ actionMessage }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Tajawal', 'Arial', sans-serif;
      }

      .attendance-tracker {
        direction: rtl;
        text-align: right;
        background: linear-gradient(145deg, #ffffff 0%, #f8f9fc 100%);
        border-radius: 1rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        padding: 2rem;
        margin-bottom: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(0, 141, 127, 0.1);
      }

      .attendance-tracker::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(
          circle,
          rgba(0, 141, 127, 0.03) 1px,
          transparent 1px
        );
        background-size: 20px 20px;
        animation: float 30s linear infinite;
        pointer-events: none;
      }

      .time-display {
        text-align: center;
        background: linear-gradient(
          135deg,
          rgba(0, 141, 127, 0.05) 0%,
          rgba(0, 141, 127, 0.1) 100%
        );
        padding: 1.5rem;
        border-radius: 0.75rem;
        border: 2px solid rgba(0, 141, 127, 0.1);
        position: relative;
        z-index: 1;
      }

      .time-display h2.time {
        font-size: 1.75rem;
        font-weight: 700;
        color: #008d7f;
        margin: 0 0 0.75rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .time-display p.date {
        font-size: 1.125rem;
        color: #666666;
        margin: 0.25rem 0;
        font-weight: 500;
      }

      .notification {
        position: relative;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        text-align: center;
        font-weight: 600;
        animation: slideIn 0.4s ease-out, pulse 2s ease-in-out;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        border: 2px solid transparent;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        z-index: 1;
      }

      .notification p {
        margin: 0;
        font-size: 1.1rem;
      }

      .notification.success {
        background: linear-gradient(
          135deg,
          rgba(76, 175, 80, 0.1) 0%,
          rgba(76, 175, 80, 0.15) 100%
        );
        color: #4caf50;
        border-color: rgba(76, 175, 80, 0.2);
      }

      .notification.error {
        background: linear-gradient(
          135deg,
          rgba(244, 67, 54, 0.1) 0%,
          rgba(244, 67, 54, 0.15) 100%
        );
        color: #f44336;
        border-color: rgba(244, 67, 54, 0.2);
      }

      .notification.warning {
        background: linear-gradient(
          135deg,
          rgba(255, 152, 0, 0.1) 0%,
          rgba(255, 152, 0, 0.15) 100%
        );
        color: #ff9800;
        border-color: rgba(255, 152, 0, 0.2);
      }

      .notification.info {
        background: linear-gradient(
          135deg,
          rgba(33, 150, 243, 0.1) 0%,
          rgba(33, 150, 243, 0.15) 100%
        );
        color: #2196f3;
        border-color: rgba(33, 150, 243, 0.2);
      }

      .notification .material-icons {
        font-size: 1.5rem;
      }

      .attendance-info {
        background: linear-gradient(145deg, #f8f9fc 0%, #ffffff 100%);
        padding: 1.5rem;
        border-radius: 0.75rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        border: 1px solid #e5e9f2;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        position: relative;
        z-index: 1;
      }

      .attendance-info h2.status-label {
        grid-column: 1 / -1;
        font-size: 1.25rem;
        font-weight: 700;
        color: #008d7f;
        margin: 0 0 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid rgba(0, 141, 127, 0.2);
      }

      .attendance-info .status-checked-in {
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(229, 233, 242, 0.5);
        transition: all 0.3s ease;
      }

      .attendance-info .status-checked-in:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border-color: rgba(0, 141, 127, 0.3);
      }

      .attendance-info .status-checked-in p {
        margin: 0 0 0.5rem;
        font-size: 0.95rem;
        color: #666666;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        line-height: 1.5;
      }

      .attendance-info .status-checked-in .status-label {
        font-weight: 700;
        color: #333333;
        font-size: 0.9rem;
      }

      .attendance-info .status-checked-in .status-time {
        color: #008d7f;
        font-weight: 600;
      }

      @media (max-width: 768px) {
        .attendance-info {
          grid-template-columns: 1fr;
          padding: 1rem;
        }
      }

      .actions {
        display: flex;
        flex-direction: row;
        gap: 1.5rem;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
      }

      .actions button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1rem 2rem;
        border: none;
        border-radius: 0.75rem;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        min-width: 180px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .actions button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          45deg,
          transparent 30%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 70%
        );
        transform: translateX(-100%);
        transition: transform 0.6s ease;
      }

      .actions button:hover::before {
        transform: translateX(100%);
      }

      .actions button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .actions button:disabled::before {
        display: none;
      }

      .actions button:active:not(:disabled) {
        transform: scale(0.96);
      }

      .actions button:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }

      .actions button .material-icons {
        font-size: 1.5rem;
      }

      .actions .check-in-btn {
        background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
        color: white;
        border: 2px solid transparent;
      }

      .actions .check-in-btn:hover:not(:disabled) {
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
      }

      .actions .check-out-btn {
        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
        color: white;
        border: 2px solid transparent;
      }

      .actions .check-out-btn:hover:not(:disabled) {
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
      }

      @media (max-width: 768px) {
        .actions {
          flex-direction: column;
          gap: 1rem;
        }
        .actions button {
          width: 100%;
          min-width: auto;
        }
      }

      @media (max-width: 576px) {
        .actions button {
          padding: 0.875rem 1.5rem;
          font-size: 1rem;
        }
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.02);
        }
      }

      @keyframes float {
        0% {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        100% {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }

      @media print {
        .attendance-tracker {
          box-shadow: none;
          border: 1px solid #e5e9f2;
          background: white;
        }
        .attendance-tracker::before {
          display: none;
        }
        .actions {
          display: none;
        }
        .notification {
          display: none;
        }
      }
    `,
  ],
})
export class AttendanceLeaveComponent implements OnInit {
  currentTime: Date = new Date();
  shifts: Shift[] = [];
  isAttendanceEnabled: boolean = false;
  isLeaveEnabled: boolean = false;
  isMidShift = false;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | 'warning' | 'info' = 'info';
  actionMessage: string = '';
  branch: Branch | null = null;
  private apiUrl = 'https://hrwebsite.runasp.net';
  private shiftApiUrl = `${this.apiUrl}/Shifts/GetByEmployeeId`;
  private attendanceApiUrl = `${this.apiUrl}/Attendance/TakeAttendance`;
  private leaveApiUrl = `${this.apiUrl}/Attendance/TakeLeave`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.loadBranch();
    this.fetchShifts();
    this.checkButtonStatus();
    setInterval(() => {
      this.currentTime = new Date();
      this.checkButtonStatus();
    }, 30000);
  }

  getFormattedDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadBranch() {
    const storedBranch = localStorage.getItem('auth_branchName');
    if (storedBranch) {
      try {
        this.branch = JSON.parse(storedBranch);
        if (
          !this.branch ||
          !this.branch.latitude ||
          !this.branch.longitude ||
          !this.branch.radius
        ) {
          this.statusMessage = 'بيانات الفرع غير صالحة في التخزين المحلي.';
          this.statusMessageType = 'error';
          this.branch = null;
        }
      } catch (e) {
        this.statusMessage = 'خطأ في تحليل بيانات الفرع.';
        this.statusMessageType = 'error';
        this.branch = null;
      }
    } else {
      this.statusMessage = 'لم يتم العثور على بيانات الفرع في التخزين المحلي.';
      this.statusMessageType = 'error';
    }
  }

  fetchShifts() {
    const userId = localStorage.getItem('auth_userId');
    const token = localStorage.getItem('auth_token');

    if (!userId || !token) {
      this.statusMessage =
        'لم يتم العثور على معرف المستخدم أو الرمز في التخزين المحلي.';
      this.statusMessageType = 'error';
      this.loadShiftsFromLocalStorage();
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    });

    // Load existing shifts from localStorage to preserve attendance/leave status
    let storedShifts: Shift[] = [];
    const storedShiftsRaw = localStorage.getItem('auth_shifts');
    const today = this.getFormattedDate(new Date());
    const storedDate = localStorage.getItem('shiftDate');

    if (storedShiftsRaw && storedDate === today) {
      try {
        storedShifts = JSON.parse(storedShiftsRaw);
      } catch (e) {
        storedShifts = [];
      }
    }

    this.http
      .get<Shift[]>(`${this.shiftApiUrl}/${userId}`, { headers })
      .subscribe({
        next: (shifts) => {
          // Merge server shifts with stored attendance/leave status
          this.shifts = shifts.map((serverShift) => {
            const storedShift = storedShifts.find(
              (s) => s.id === serverShift.id
            );
            return {
              ...serverShift,
              hasAttendanceTaken: storedShift?.hasAttendanceTaken ?? false,
              hasLeaveTaken: storedShift?.hasLeaveTaken ?? false,
            };
          });
          this.saveShifts();
          this.statusMessageType = 'success';
          this.statusMessage = 'شكرا لوجودك معنا.';
          this.checkButtonStatus();
        },
        error: () => {
          this.statusMessage = 'فشل في جلب الورديات من الخادم.';
          this.statusMessageType = 'error';
          this.loadShiftsFromLocalStorage();
        },
      });
  }

  loadShiftsFromLocalStorage() {
    const storedShifts = localStorage.getItem('auth_shifts');
    const today = this.getFormattedDate(new Date());
    const storedDate = localStorage.getItem('shiftDate');

    if (storedShifts && storedDate === today) {
      try {
        this.shifts = JSON.parse(storedShifts);
        this.statusMessage = 'تم تحميل الورديات من التخزين المحلي.';
        this.statusMessageType = 'info';
      } catch (e) {
        this.statusMessage = 'خطأ في تحليل الورديات من التخزين المحلي.';
        this.statusMessageType = 'error';
        this.shifts = [];
      }
    } else {
      this.shifts = [];
      if (storedDate !== today) {
        this.statusMessage = 'تم إعادة تعيين الورديات ليوم جديد.';
        this.statusMessageType = 'info';
      } else {
        this.statusMessage = 'لم يتم العثور على ورديات في التخزين المحلي.';
        this.statusMessageType = 'error';
      }
      this.saveShifts();
    }
  }

  saveShifts() {
    localStorage.setItem(
      'auth_shifts',
      JSON.stringify(
        this.shifts.map((shift) => ({
          id: shift.id,
          startTime: shift.startTime,
          endTime: shift.endTime,
          employeeId: shift.employeeId,
          hasAttendanceTaken: shift.hasAttendanceTaken,
          hasLeaveTaken: shift.hasLeaveTaken,
        }))
      )
    );
    localStorage.setItem('shiftDate', this.getFormattedDate(new Date()));
  }

  isMidnightShift(startTime: string, endTime: string): boolean {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes <= startTotalMinutes;
  }

  getNextShiftStart(): Date | null {
    const now = this.currentTime;
    let nextShiftStart: Date | null = null;

    for (const shift of this.shifts) {
      let startDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...shift.startTime.split(':').map(Number)
      );
      let endDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...shift.endTime.split(':').map(Number)
      );

      if (this.isMidnightShift(shift.startTime, shift.endTime)) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      if (
        startDateTime < now &&
        !this.isMidnightShift(shift.startTime, shift.endTime)
      ) {
        startDateTime.setDate(startDateTime.getDate() + 1);
      }

      if (
        startDateTime > now &&
        (!nextShiftStart || startDateTime < nextShiftStart)
      ) {
        nextShiftStart = startDateTime;
      }
    }
    return nextShiftStart;
  }

  checkButtonStatus() {
    if (!this.branch) {
      this.isAttendanceEnabled = false;
      this.isLeaveEnabled = false;
      this.statusMessage =
        this.statusMessage ||
        'لم يتم العثور على بيانات الفرع في التخزين المحلي.';
      this.statusMessageType = 'error';
      return;
    }

    if (this.shifts.length === 0) {
      this.isAttendanceEnabled = false;
      this.isLeaveEnabled = false;
      this.isMidShift = false;
      this.statusMessage = this.statusMessage || 'يتم تحميل الورديات.';
      this.statusMessageType = 'warning';
      return;
    }

    const now = this.currentTime;
    let isWithinAnyShift = false;
    let isAfterAnyShiftWithAttendance = false;
    let currentShiftId: number | null = null;
    const nextShiftStart = this.getNextShiftStart();

    for (const shift of this.shifts) {
      this.isMidShift = false;

      let startDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...shift.startTime.split(':').map(Number)
      );
      let endDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...shift.endTime.split(':').map(Number)
      );
      console.log('is mid shift');

      if (this.isMidnightShift(shift.startTime, shift.endTime)) {
        console.log('is mid shift');
        this.isMidShift = true;
        console.log(this.isMidShift);
        endDateTime.setDate(endDateTime.getDate() + 1);
      } else {
        this.isMidShift = false;
      }
      console.log(this.isMidShift, 'before if con');
      if (
        (!shift.hasLeaveTaken &&
          this.isMidShift &&
          now >= startDateTime &&
          now <= endDateTime) ||
        (now >= startDateTime &&
          now <= endDateTime &&
          !shift.hasAttendanceTaken)
      ) {
        isWithinAnyShift = true;
        isAfterAnyShiftWithAttendance = false;
        currentShiftId = shift.id;
      }

      if (
        (!shift.hasLeaveTaken && this.isMidShift) ||
        (now > endDateTime &&
          shift.hasAttendanceTaken &&
          !isWithinAnyShift &&
          !shift.hasLeaveTaken &&
          (!nextShiftStart || now < nextShiftStart))
      ) {
        isAfterAnyShiftWithAttendance = true;
        isWithinAnyShift = false;

        currentShiftId = shift.id;
      } else {
        console.log(
          'check',
          now,
          'now',
          endDateTime,
          shift.hasAttendanceTaken,
          'attanen',
          shift.hasLeaveTaken,
          'leave',
          this.isMidShift
        );
      }
    }

    this.isAttendanceEnabled = isWithinAnyShift;
    this.isLeaveEnabled = isAfterAnyShiftWithAttendance;

    this.statusMessage = this.isAttendanceEnabled
      ? `تمكين تسجيل الحضور (خلال الوردية ${currentShiftId}).`
      : this.isLeaveEnabled
      ? 'تمكين تسجيل الانصراف (بعد الوردية مع الحضور، وقبل الوردية التالية).'
      : this.statusMessage ||
        'الأزرار معطلة (لا توجد وردية صالحة، أو لم يتم تسجيل الحضور، أو بدأت الوردية التالية).';
    this.statusMessageType =
      this.isAttendanceEnabled || this.isLeaveEnabled
        ? 'success'
        : this.statusMessageType || 'warning';
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async checkLocation(): Promise<GeolocationPosition | null> {
    if (!this.branch) {
      this.actionMessage = 'بيانات الفرع غير متوفرة.';
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      const distance = this.calculateDistance(
        userLat,
        userLon,
        this.branch.latitude,
        this.branch.longitude
      );

      if (distance <= this.branch.radius) {
        return position;
      } else {
        this.actionMessage = `خارج نطاق الفرع (${
          this.branch.name
        }). المسافة: ${distance.toFixed(2)} متر.`;
        return null;
      }
    } catch (error) {
      this.actionMessage =
        'خطأ في تحديد الموقع: يرجى التأكد من تفعيل خدمات الموقع.';
      return null;
    }
  }

  async onAttendanceClick() {
    const position = await this.checkLocation();

    if (!position) return;

    const userId = localStorage.getItem('auth_userId');
    const token = localStorage.getItem('auth_token');
    if (!userId || !token) {
      this.actionMessage =
        'لم يتم العثور على معرف المستخدم أو الرمز في التخزين المحلي.';
      return;
    }

    const now = new Date(this.currentTime);
    const timeToRequest = new Date(now);
    timeToRequest.setHours(now.getHours() + 3); // Adjust for Asia/Riyadh time zone

    let selectedShift: Shift | null = null;

    for (const shift of this.shifts) {
      let startDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...shift.startTime.split(':').map(Number)
      );
      let endDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...shift.endTime.split(':').map(Number)
      );

      if (this.isMidnightShift(shift.startTime, shift.endTime)) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      if (
        (now >= startDateTime &&
          now <= endDateTime &&
          !shift.hasAttendanceTaken) ||
        this.isMidShift
      ) {
        selectedShift = shift;
        break;
      }
    }

    if (!selectedShift) {
      this.actionMessage = 'لم يتم العثور على وردية صالحة لتسجيل الحضور.';
      return;
    }
    console.log(timeToRequest.toISOString());
    const request: AttendanceRequest = {
      timeOfAttend: timeToRequest.toISOString(),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      employeeId: userId,
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
      'Content-Type': 'application/json',
    });

    this.http
      .post(this.attendanceApiUrl, request, { headers, responseType: 'text' })
      .subscribe({
        next: () => {
          selectedShift!.hasAttendanceTaken = true;
          this.saveShifts();
          this.actionMessage = `تم تسجيل الحضور للوردية ${
            selectedShift!.id
          } في ${now.toLocaleTimeString('ar-SA', {
            timeZone: 'Asia/Riyadh',
          })} جزاكم الله خيرا`;
          this.checkButtonStatus();
        },
        error: () => {
          this.actionMessage = 'فشل في تسجيل الحضور. يرجى المحاولة مرة أخرى.';
        },
      });
    this.currentTime = new Date();
  }

  async onLeaveClick() {
    const position = await this.checkLocation();
    if (!position) return;

    const userId = localStorage.getItem('auth_userId');
    const token = localStorage.getItem('auth_token');
    if (!userId || !token) {
      this.actionMessage =
        'لم يتم العثور على معرف المستخدم أو الرمز في التخزين المحلي.';
      return;
    }

    const now = new Date(this.currentTime);
    const timeToRequest = new Date(now);
    timeToRequest.setHours(now.getHours() + 3);

    const nextShiftStart = this.getNextShiftStart();
    let selectedShift: Shift | null = null;

    for (const shift of this.shifts) {
      let endDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        ...shift.endTime.split(':').map(Number)
      );

      if (this.isMidnightShift(shift.startTime, shift.endTime)) {
        selectedShift = shift;

        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      if (
        (now > endDateTime &&
          !shift.hasLeaveTaken &&
          (!nextShiftStart || now < nextShiftStart) &&
          this.isMidShift) ||
        (now > endDateTime &&
          shift.hasAttendanceTaken &&
          !shift.hasLeaveTaken &&
          (!nextShiftStart || now < nextShiftStart))
      ) {
        selectedShift = shift;
        break;
      }
    }

    if (!selectedShift) {
      this.actionMessage = 'لم يتم العثور على وردية صالحة لتسجيل الانصراف.';
      return;
    }
    console.log(timeToRequest.toISOString());

    const request: LeaveRequest = {
      timeOfLeave: timeToRequest.toISOString(),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      employeeId: userId,
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
      'Content-Type': 'application/json',
    });

    this.http.post(this.leaveApiUrl, request, { headers }).subscribe({
      next: () => {
        selectedShift!.hasLeaveTaken = true;
        this.saveShifts();
        this.actionMessage = `تم تسجيل الانصراف للوردية ${
          selectedShift!.id
        } في ${now.toLocaleTimeString('ar-SA', {
          timeZone: 'Asia/Riyadh',
        })} في رعاية الله`;
        this.checkButtonStatus();
      },
      error: () => {
        this.actionMessage = 'فشل في تسجيل الانصراف. يرجى المحاولة مرة أخرى.';
      },
    });
    this.currentTime = new Date();
  }
}
